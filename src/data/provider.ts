import type { User } from "@supabase/supabase-js";
import { getSupabase } from "@/lib/supabase";

export type ProviderType = "freelancer" | "company";

export type ProviderProfile = {
  id: string;
  providerType: ProviderType;
  fullName: string;
  companyName: string;
  contactEmail: string;
  phone: string;
  website: string;
  taxId: string;
  address: string;
  bankAccount: string;
  createdAt: string;
  updatedAt: string;
};

export type ProviderProfileInput = Omit<ProviderProfile, "id" | "createdAt" | "updatedAt">;

export type ProviderDocumentData = {
  name: string;
  contactName?: string;
  email?: string;
  phone?: string;
  website?: string;
  taxId?: string;
  address?: string;
  bankAccount?: string;
};

type ProviderRow = {
  id: string;
  provider_type: ProviderType | null;
  full_name: string | null;
  company_name: string | null;
  contact_email: string | null;
  phone: string | null;
  website: string | null;
  tax_id: string | null;
  address: string | null;
  bank_account: string | null;
  created_at: string;
  updated_at: string | null;
};

let cachedProviderProfile: ProviderProfile | null = null;

function mapProvider(row: ProviderRow): ProviderProfile {
  return {
    id: row.id,
    providerType: row.provider_type ?? "freelancer",
    fullName: row.full_name ?? "",
    companyName: row.company_name ?? "",
    contactEmail: row.contact_email ?? "",
    phone: row.phone ?? "",
    website: row.website ?? "",
    taxId: row.tax_id ?? "",
    address: row.address ?? "",
    bankAccount: row.bank_account ?? "",
    createdAt: row.created_at,
    updatedAt: row.updated_at ?? row.created_at,
  };
}

async function authenticatedUser() {
  const client = getSupabase();
  const {
    data: { user },
    error,
  } = await client.auth.getUser();
  if (error) throw error;
  if (!user) throw new Error("Sesja wygasła. Zaloguj się ponownie.");
  return { client, user };
}

export function getCachedProviderProfile() {
  return cachedProviderProfile;
}

export async function fetchProviderProfile(): Promise<ProviderProfile> {
  const { client, user } = await authenticatedUser();
  const { data, error } = await client
    .from("profiles")
    .select(
      "id, provider_type, full_name, company_name, contact_email, phone, website, tax_id, address, bank_account, created_at, updated_at",
    )
    .eq("id", user.id)
    .single();

  if (error) throw error;
  cachedProviderProfile = mapProvider(data as ProviderRow);
  return cachedProviderProfile;
}

export async function saveProviderProfile(input: ProviderProfileInput): Promise<ProviderProfile> {
  const { client, user } = await authenticatedUser();
  const { data, error } = await client
    .from("profiles")
    .update({
      provider_type: input.providerType,
      full_name: input.fullName || null,
      company_name: input.companyName || null,
      contact_email: input.contactEmail || null,
      phone: input.phone || null,
      website: input.website || null,
      tax_id: input.taxId || null,
      address: input.address || null,
      bank_account: input.bankAccount || null,
    })
    .eq("id", user.id)
    .select(
      "id, provider_type, full_name, company_name, contact_email, phone, website, tax_id, address, bank_account, created_at, updated_at",
    )
    .single();

  if (error) throw error;

  const metadata =
    input.providerType === "company"
      ? { full_name: input.fullName, company_name: input.companyName }
      : { full_name: input.fullName, company_name: "" };
  await client.auth.updateUser({ data: metadata });

  cachedProviderProfile = mapProvider(data as ProviderRow);
  return cachedProviderProfile;
}

export function getProviderDisplayName(profile: ProviderProfile | null | undefined, user: User | null) {
  if (profile?.providerType === "company" && profile.companyName) return profile.companyName;
  if (profile?.fullName) return profile.fullName;
  const metadata = user?.user_metadata ?? {};
  return metadata.company_name || metadata.full_name || user?.email || "Wykonawca";
}

export function toProviderDocumentData(
  profile: ProviderProfile | null | undefined,
  user: User | null,
): ProviderDocumentData {
  const fallbackEmail = user?.email ?? "";
  return {
    name: getProviderDisplayName(profile, user),
    contactName:
      profile?.providerType === "company" && profile.fullName ? profile.fullName : undefined,
    email: profile?.contactEmail || fallbackEmail || undefined,
    phone: profile?.phone || undefined,
    website: profile?.website || undefined,
    taxId: profile?.providerType === "company" ? profile.taxId || undefined : undefined,
    address: profile?.providerType === "company" ? profile.address || undefined : undefined,
    bankAccount: profile?.providerType === "company" ? profile.bankAccount || undefined : undefined,
  };
}

export function toProviderDocumentDataWithFallback(
  profile: ProviderProfile | null | undefined,
  fallbackName: string,
  fallbackEmail?: string,
): ProviderDocumentData {
  return {
    name:
      profile?.providerType === "company" && profile.companyName
        ? profile.companyName
        : profile?.fullName || fallbackName,
    contactName:
      profile?.providerType === "company" && profile.fullName ? profile.fullName : undefined,
    email: profile?.contactEmail || fallbackEmail || undefined,
    phone: profile?.phone || undefined,
    website: profile?.website || undefined,
    taxId: profile?.providerType === "company" ? profile.taxId || undefined : undefined,
    address: profile?.providerType === "company" ? profile.address || undefined : undefined,
    bankAccount: profile?.providerType === "company" ? profile.bankAccount || undefined : undefined,
  };
}

export function providerContactLines(data: ProviderDocumentData) {
  return [
    data.contactName,
    data.taxId ? `NIP: ${data.taxId}` : undefined,
    data.address,
    [data.email, data.phone].filter(Boolean).join(" · ") || undefined,
    data.website,
    data.bankAccount ? `Rachunek: ${data.bankAccount}` : undefined,
  ].filter((line): line is string => Boolean(line));
}
