export type OfferStatus = "draft" | "ready" | "sent" | "accepted" | "rejected" | "archived";
export type OfferTone = "formal" | "partner" | "sales";

export type Offer = {
  id: string;
  leadId: string;
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
  createdAt: string;
  updatedAt: string;
  number: string;
};

export const statusLabels: Record<OfferStatus, string> = {
  draft: "Szkic",
  ready: "Gotowa",
  sent: "Wysłana",
  accepted: "Zaakceptowana",
  rejected: "Odrzucona",
  archived: "Zarchiwizowana",
};

export const toneLabels: Record<OfferTone, string> = {
  formal: "Formalny",
  partner: "Partnerski",
  sales: "Sprzedażowy",
};

export function isOfferComplete(offer: Pick<Offer, "scope" | "price" | "deliveryTime" | "tone">) {
  return Boolean(
    offer.scope?.trim() &&
    offer.price !== null &&
    offer.price >= 0 &&
    offer.deliveryTime?.trim() &&
    offer.tone,
  );
}

export function formatPrice(value: number | null) {
  if (value === null) return "Nie uzupełniono";
  return new Intl.NumberFormat("pl-PL", {
    style: "currency",
    currency: "PLN",
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat("pl-PL", { dateStyle: "medium" }).format(new Date(value));
}
