import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Offer, OfferStatus, OfferTone } from "@/data/offers";
import { assertSupabaseConfigured, supabase } from "@/lib/supabase";

type LeadRow = {
  id: string;
  client_name: string;
  client_email: string | null;
  industry: string | null;
  client_problem: string;
  proposed_service: string;
};

type OfferRow = {
  id: string;
  lead_id: string;
  scope: string | null;
  price: number | string | null;
  delivery_time: string | null;
  additional_information: string | null;
  tone: OfferTone | null;
  status: OfferStatus;
  created_at: string;
  updated_at: string;
  leads: LeadRow | LeadRow[];
};

export type OfferInput = {
  client: string;
  clientEmail: string | null;
  industry: string | null;
  problem: string;
  service: string;
  scope: string | null;
  price: number | null;
  deliveryTime: string | null;
  notes: string | null;
  tone: OfferTone | null;
  status: OfferStatus;
};

function mapOffer(row: OfferRow): Offer {
  const lead = Array.isArray(row.leads) ? row.leads[0] : row.leads;
  const date = new Date(row.created_at);
  return {
    id: row.id,
    leadId: row.lead_id,
    client: lead.client_name,
    clientEmail: lead.client_email,
    industry: lead.industry,
    problem: lead.client_problem,
    service: lead.proposed_service,
    scope: row.scope,
    price: row.price === null ? null : Number(row.price),
    deliveryTime: row.delivery_time,
    notes: row.additional_information,
    tone: row.tone,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    number: `OF/${date.getFullYear()}/${row.id.slice(0, 8).toUpperCase()}`,
  };
}

export function useOffers() {
  return useQuery({
    queryKey: ["offers"],
    queryFn: async () => {
      assertSupabaseConfigured();
      const { data, error } = await supabase
        .from("offers")
        .select(
          "id, lead_id, scope, price, delivery_time, additional_information, tone, status, created_at, updated_at, leads!inner(id, client_name, client_email, industry, client_problem, proposed_service)",
        )
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data as unknown as OfferRow[]).map(mapOffer);
    },
  });
}

export function useProfile() {
  return useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      assertSupabaseConfigured();
      const { data, error } = await supabase
        .from("profiles")
        .select("id, company_name, full_name, created_at")
        .single();
      if (error) throw error;
      return data as {
        id: string;
        company_name: string | null;
        full_name: string | null;
        created_at: string;
      };
    },
  });
}

export function useCreateOffer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: OfferInput) => {
      assertSupabaseConfigured();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Sesja wygasła. Zaloguj się ponownie.");

      const { data: lead, error: leadError } = await supabase
        .from("leads")
        .insert({
          user_id: user.id,
          client_name: input.client,
          client_email: input.clientEmail,
          industry: input.industry,
          client_problem: input.problem,
          proposed_service: input.service,
        })
        .select("id")
        .single();
      if (leadError) throw leadError;

      const { data: offer, error: offerError } = await supabase
        .from("offers")
        .insert({
          user_id: user.id,
          lead_id: lead.id,
          scope: input.scope,
          price: input.price,
          delivery_time: input.deliveryTime,
          additional_information: input.notes,
          tone: input.tone,
          status: input.status,
        })
        .select("id")
        .single();

      if (offerError) {
        await supabase.from("leads").delete().eq("id", lead.id);
        throw offerError;
      }
      return offer.id as string;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["offers"] }),
  });
}

export function useSetOfferStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: OfferStatus }) => {
      const { error } = await supabase.from("offers").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["offers"] }),
  });
}
