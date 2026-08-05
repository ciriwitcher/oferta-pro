import { getSupabase } from "@/lib/supabase";
import {
  normalizeOfferAiAnalysis,
  type OfferAiAnalysis,
} from "@/lib/ai-inquiry";

export type OfferStatus = "draft" | "ready" | "sent" | "accepted" | "rejected" | "archived";
export type OfferTone = "formal" | "partner" | "sales";

export type Offer = {
  id: string;
  leadId: string;
  client: string;
  clientEmail: string;
  industry: string;
  problem: string;
  service: string;
  scope: string;
  price: number | null;
  deliveryTime: string;
  notes: string;
  tone: OfferTone | null;
  status: OfferStatus;
  aiAnalysis: OfferAiAnalysis | null;
  createdAt: string;
  updatedAt: string;
  number: string;
};

export type NewOfferInput = {
  client: string;
  clientEmail: string;
  industry: string;
  problem: string;
  service: string;
  scope: string;
  price: number | null;
  deliveryTime: string;
  notes: string;
  tone: OfferTone | null;
  aiAnalysis: OfferAiAnalysis | null;
};

type LeadRow = {
  id: string;
  user_id: string;
  client_name: string;
  client_email: string | null;
  industry: string | null;
  client_problem: string;
  proposed_service: string;
  status: string;
  created_at: string;
  updated_at: string;
};

type OfferRow = {
  id: string;
  user_id: string;
  lead_id: string;
  scope: string | null;
  price: number | string | null;
  delivery_time: string | null;
  additional_information: string | null;
  tone: OfferTone | null;
  status: OfferStatus;
  ai_analysis: unknown;
  created_at: string;
  updated_at: string;
};

export const statusLabels: Record<OfferStatus, string> = {
  draft: "Szkic",
  ready: "Gotowa",
  sent: "Wysłana",
  accepted: "Zaakceptowana",
  rejected: "Odrzucona",
  archived: "Archiwalna",
};

export const toneLabels: Record<OfferTone, string> = {
  formal: "Formalny",
  partner: "Partnerski",
  sales: "Sprzedażowy",
};

function makeOfferNumber(createdAt: string, id: string) {
  const date = new Date(createdAt);
  const year = Number.isNaN(date.getTime()) ? new Date().getFullYear() : date.getFullYear();
  return `OF/${year}/${id.slice(0, 8).toUpperCase()}`;
}

function mapOffer(row: OfferRow, lead: LeadRow): Offer {
  return {
    id: row.id,
    leadId: row.lead_id,
    client: lead.client_name,
    clientEmail: lead.client_email ?? "",
    industry: lead.industry ?? "",
    problem: lead.client_problem,
    service: lead.proposed_service,
    scope: row.scope ?? "",
    price: row.price == null ? null : Number(row.price),
    deliveryTime: row.delivery_time ?? "",
    notes: row.additional_information ?? "",
    tone: row.tone,
    status: row.status,
    aiAnalysis: normalizeOfferAiAnalysis(row.ai_analysis),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    number: makeOfferNumber(row.created_at, row.id),
  };
}

export async function fetchOffers(): Promise<Offer[]> {
  const client = getSupabase();
  const { data: offerRows, error: offersError } = await client
    .from("offers")
    .select("*")
    .order("created_at", { ascending: false });

  if (offersError) throw offersError;
  if (!offerRows?.length) return [];

  const leadIds = [...new Set((offerRows as OfferRow[]).map((offer) => offer.lead_id))];
  const { data: leadRows, error: leadsError } = await client.from("leads").select("*").in("id", leadIds);

  if (leadsError) throw leadsError;

  const leadsById = new Map((leadRows as LeadRow[] | null)?.map((lead) => [lead.id, lead]) ?? []);

  return (offerRows as OfferRow[])
    .map((offer) => {
      const lead = leadsById.get(offer.lead_id);
      return lead ? mapOffer(offer, lead) : null;
    })
    .filter((offer): offer is Offer => offer !== null);
}

async function getAuthenticatedUser() {
  const client = getSupabase();
  const {
    data: { user },
    error,
  } = await client.auth.getUser();

  if (error) throw error;
  if (!user) throw new Error("Sesja wygasła. Zaloguj się ponownie.");

  return { client, user };
}

export async function createOffer(input: NewOfferInput, status: "draft" | "ready") {
  const { client, user } = await getAuthenticatedUser();

  const { data: lead, error: leadError } = await client
    .from("leads")
    .insert({
      user_id: user.id,
      client_name: input.client,
      client_email: input.clientEmail || null,
      industry: input.industry || null,
      client_problem: input.problem,
      proposed_service: input.service || "Do ustalenia",
      status: "active",
    })
    .select("*")
    .single();

  if (leadError) throw leadError;

  const { data: offer, error: offerError } = await client
    .from("offers")
    .insert({
      user_id: user.id,
      lead_id: lead.id,
      scope: input.scope || null,
      price: input.price,
      delivery_time: input.deliveryTime || null,
      additional_information: input.notes || null,
      tone: input.tone ?? "partner",
      status,
      ai_analysis: input.aiAnalysis,
    })
    .select("*")
    .single();

  if (offerError) {
    await client.from("leads").delete().eq("id", lead.id);
    throw offerError;
  }

  return mapOffer(offer as OfferRow, lead as LeadRow);
}

export async function updateOffer(
  offerId: string,
  leadId: string,
  input: NewOfferInput,
  status: "draft" | "ready",
) {
  const { client, user } = await getAuthenticatedUser();

  const { data: lead, error: leadError } = await client
    .from("leads")
    .update({
      client_name: input.client,
      client_email: input.clientEmail || null,
      industry: input.industry || null,
      client_problem: input.problem,
      proposed_service: input.service || "Do ustalenia",
    })
    .eq("id", leadId)
    .eq("user_id", user.id)
    .select("*")
    .single();

  if (leadError) throw leadError;

  const { data: offer, error: offerError } = await client
    .from("offers")
    .update({
      scope: input.scope || null,
      price: input.price,
      delivery_time: input.deliveryTime || null,
      additional_information: input.notes || null,
      tone: input.tone ?? "partner",
      status,
      ai_analysis: input.aiAnalysis,
    })
    .eq("id", offerId)
    .eq("user_id", user.id)
    .select("*")
    .single();

  if (offerError) throw offerError;

  return mapOffer(offer as OfferRow, lead as LeadRow);
}

export async function updateOfferStatus(id: string, status: OfferStatus) {
  const { error } = await getSupabase()
    .from("offers")
    .update({ status })
    .eq("id", id);

  if (error) throw error;
}

export async function deleteOfferByLead(leadId: string) {
  const { error } = await getSupabase().from("leads").delete().eq("id", leadId);
  if (error) throw error;
}

export function formatPrice(value: number | null) {
  if (value == null) return "Nie ustalono";
  return new Intl.NumberFormat("pl-PL", {
    style: "currency",
    currency: "PLN",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("pl-PL", { dateStyle: "medium" }).format(date);
}
