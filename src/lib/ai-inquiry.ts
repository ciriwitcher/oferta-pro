import { getSupabase } from "@/lib/supabase";

export type OfferAiAnalysis = {
  clientName: string;
  clientEmail: string;
  industry: string;
  problemSummary: string;
  projectGoal: string;
  proposedSolution: string;
  scopeItems: string[];
  resultItems: string[];
  exclusionItems: string[];
  clarifyingQuestions: string[];
  suggestedDeliveryTime: string;
  professionalOfferText: string;
  assumptions: string[];
  confidence: number;
  generatedAt: string;
  model: string;
};

type AnalyzeInput = {
  inquiry: string;
  clientName?: string;
  clientEmail?: string;
  industry?: string;
};

type ApiAnalysis = {
  client_name?: unknown;
  client_email?: unknown;
  industry?: unknown;
  problem_summary?: unknown;
  project_goal?: unknown;
  proposed_solution?: unknown;
  scope_items?: unknown;
  result_items?: unknown;
  exclusion_items?: unknown;
  clarifying_questions?: unknown;
  suggested_delivery_time?: unknown;
  professional_offer_text?: unknown;
  assumptions?: unknown;
  confidence?: unknown;
  generated_at?: unknown;
  model?: unknown;
};

function stringValue(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function stringArray(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 30);
}

function confidenceValue(value: unknown) {
  const number = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(number)) return 0;
  return Math.max(0, Math.min(1, number));
}

export function normalizeOfferAiAnalysis(value: unknown): OfferAiAnalysis | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Partial<OfferAiAnalysis>;

  const normalized: OfferAiAnalysis = {
    clientName: stringValue(raw.clientName),
    clientEmail: stringValue(raw.clientEmail),
    industry: stringValue(raw.industry),
    problemSummary: stringValue(raw.problemSummary),
    projectGoal: stringValue(raw.projectGoal),
    proposedSolution: stringValue(raw.proposedSolution),
    scopeItems: stringArray(raw.scopeItems),
    resultItems: stringArray(raw.resultItems),
    exclusionItems: stringArray(raw.exclusionItems),
    clarifyingQuestions: stringArray(raw.clarifyingQuestions),
    suggestedDeliveryTime: stringValue(raw.suggestedDeliveryTime),
    professionalOfferText: stringValue(raw.professionalOfferText),
    assumptions: stringArray(raw.assumptions),
    confidence: confidenceValue(raw.confidence),
    generatedAt: stringValue(raw.generatedAt),
    model: stringValue(raw.model),
  };

  const hasUsefulContent = Boolean(
    normalized.problemSummary ||
      normalized.projectGoal ||
      normalized.proposedSolution ||
      normalized.scopeItems.length ||
      normalized.professionalOfferText,
  );
  return hasUsefulContent ? normalized : null;
}

function mapApiAnalysis(raw: ApiAnalysis): OfferAiAnalysis {
  return {
    clientName: stringValue(raw.client_name),
    clientEmail: stringValue(raw.client_email),
    industry: stringValue(raw.industry),
    problemSummary: stringValue(raw.problem_summary),
    projectGoal: stringValue(raw.project_goal),
    proposedSolution: stringValue(raw.proposed_solution),
    scopeItems: stringArray(raw.scope_items),
    resultItems: stringArray(raw.result_items),
    exclusionItems: stringArray(raw.exclusion_items),
    clarifyingQuestions: stringArray(raw.clarifying_questions),
    suggestedDeliveryTime: stringValue(raw.suggested_delivery_time),
    professionalOfferText: stringValue(raw.professional_offer_text),
    assumptions: stringArray(raw.assumptions),
    confidence: confidenceValue(raw.confidence),
    generatedAt: stringValue(raw.generated_at) || new Date().toISOString(),
    model: stringValue(raw.model),
  };
}

export async function analyzeClientInquiry(input: AnalyzeInput) {
  const client = getSupabase();
  const {
    data: { session },
    error: sessionError,
  } = await client.auth.getSession();

  if (sessionError) throw sessionError;
  if (!session?.access_token) throw new Error("Sesja wygasła. Zaloguj się ponownie.");

  const response = await fetch("/api/analyze-inquiry", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify(input),
  });

  const payload = (await response.json().catch(() => null)) as
    | { analysis?: ApiAnalysis; error?: string }
    | null;

  if (!response.ok) {
    throw new Error(payload?.error || "Nie udało się przeanalizować zapytania.");
  }
  if (!payload?.analysis) throw new Error("AI nie zwróciło poprawnej analizy.");

  return mapApiAnalysis(payload.analysis);
}
