import { createFileRoute } from "@tanstack/react-router";

const SUPABASE_URL = "https://mimbwkllauuvmpablzgr.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_E-HYCCY8JRO36g9jhQP__g_wo4Gd22j";
const HOURLY_LIMIT = 10;
const MAX_INQUIRY_CHARACTERS = 12_000;

const analysisSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    client_name: { type: "string" },
    client_email: { type: "string" },
    industry: { type: "string" },
    problem_summary: { type: "string" },
    project_goal: { type: "string" },
    proposed_solution: { type: "string" },
    scope_items: { type: "array", items: { type: "string" } },
    result_items: { type: "array", items: { type: "string" } },
    exclusion_items: { type: "array", items: { type: "string" } },
    clarifying_questions: { type: "array", items: { type: "string" } },
    suggested_delivery_time: { type: "string" },
    professional_offer_text: { type: "string" },
    assumptions: { type: "array", items: { type: "string" } },
    confidence: { type: "number" },
  },
  required: [
    "client_name",
    "client_email",
    "industry",
    "problem_summary",
    "project_goal",
    "proposed_solution",
    "scope_items",
    "result_items",
    "exclusion_items",
    "clarifying_questions",
    "suggested_delivery_time",
    "professional_offer_text",
    "assumptions",
    "confidence",
  ],
} as const;

const developerInstructions = `Jesteś analitykiem sprzedażowym wspierającym freelancerów i małe agencje.
Analizujesz surowe zapytanie klienta i przygotowujesz rzetelny, edytowalny szkic oferty w języku polskim.

Zasady bezwzględne:
1. Nie wymyślaj faktów, wymagań, budżetu, technologii ani danych klienta, których nie ma w wiadomości.
2. Rozsądne propozycje oznacz jako założenia. Brakujące informacje zamień na konkretne pytania.
3. Nie ustalaj ceny. Cena należy do freelancera.
4. Sugerowany termin ma być ostrożnym przedziałem i zawierać warunek, np. „4–6 tygodni od dostarczenia materiałów i akceptacji zakresu”.
5. Zakres opisuj jako konkretne elementy dostarczane klientowi. Rezultaty opisuj jako korzyści lub efekty biznesowe, bez gwarantowania wyników.
6. Elementy poza zakresem mają ograniczać ryzyko scope creep i być adekwatne do zapytania.
7. Profesjonalna treść oferty ma być krótka, rzeczowa i gotowa do dalszej edycji. Bez pustych sloganów, presji sprzedażowej i niepotwierdzonych obietnic.
8. Jeżeli nazwa klienta, e-mail lub branża nie wynikają z wiadomości ani przekazanego kontekstu, zwróć pusty ciąg znaków.
9. confidence podaj jako liczbę od 0 do 1 określającą, jak kompletne jest zapytanie do przygotowania oferty.
10. Zwróć wyłącznie dane zgodne ze schematem JSON.`;

type AnalyzeBody = {
  inquiry?: unknown;
  clientName?: unknown;
  clientEmail?: unknown;
  industry?: unknown;
};

type SupabaseUser = { id?: string };
type UsageRow = { id: string };

type OpenAIResponse = {
  status?: string;
  output_text?: string;
  output?: Array<{
    type?: string;
    content?: Array<{ type?: string; text?: string; refusal?: string }>;
  }>;
  usage?: { input_tokens?: number; output_tokens?: number };
  error?: { message?: string; code?: string };
};

function json(data: unknown, status = 200) {
  return Response.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

function getBearerToken(request: Request) {
  const header = request.headers.get("authorization") ?? "";
  return header.startsWith("Bearer ") ? header.slice(7).trim() : "";
}

function authHeaders(token: string, extra?: Record<string, string>) {
  return {
    apikey: SUPABASE_PUBLISHABLE_KEY,
    Authorization: `Bearer ${token}`,
    ...extra,
  };
}

async function verifyUser(token: string) {
  const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: authHeaders(token),
  });
  if (!response.ok) return null;
  const user = (await response.json()) as SupabaseUser;
  return user.id ? { id: user.id } : null;
}

async function getRecentUsageCount(token: string) {
  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const params = new URLSearchParams({
    select: "id",
    created_at: `gte.${since}`,
    limit: String(HOURLY_LIMIT),
  });
  const response = await fetch(`${SUPABASE_URL}/rest/v1/ai_generations?${params}`, {
    headers: authHeaders(token),
  });
  if (!response.ok) throw new Error("AI_USAGE_READ_FAILED");
  const rows = (await response.json()) as UsageRow[];
  return rows.length;
}

async function createUsageRow(token: string, userId: string, model: string, inputCharacters: number) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/ai_generations`, {
    method: "POST",
    headers: authHeaders(token, {
      "Content-Type": "application/json",
      Prefer: "return=representation",
    }),
    body: JSON.stringify({
      user_id: userId,
      model,
      input_characters: inputCharacters,
      status: "pending",
    }),
  });
  if (!response.ok) throw new Error("AI_USAGE_CREATE_FAILED");
  const rows = (await response.json()) as UsageRow[];
  if (!rows[0]?.id) throw new Error("AI_USAGE_CREATE_FAILED");
  return rows[0].id;
}

async function updateUsageRow(
  token: string,
  id: string,
  update: {
    status: "completed" | "failed";
    input_tokens?: number;
    output_tokens?: number;
    error_code?: string;
  },
) {
  try {
    const params = new URLSearchParams({ id: `eq.${id}` });
    await fetch(`${SUPABASE_URL}/rest/v1/ai_generations?${params}`, {
      method: "PATCH",
      headers: authHeaders(token, { "Content-Type": "application/json" }),
      body: JSON.stringify(update),
    });
  } catch {
    // Rejestrowanie użycia nie może zamienić poprawnej analizy w błąd dla użytkownika.
  }
}

function extractOutputText(payload: OpenAIResponse) {
  if (typeof payload.output_text === "string" && payload.output_text.trim()) {
    return payload.output_text.trim();
  }

  for (const item of payload.output ?? []) {
    for (const content of item.content ?? []) {
      if (content.type === "output_text" && typeof content.text === "string") {
        return content.text.trim();
      }
      if (content.type === "refusal" && content.refusal) {
        throw new Error("OPENAI_REFUSAL");
      }
    }
  }
  return "";
}

export const Route = createFileRoute("/api/analyze-inquiry")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const token = getBearerToken(request);
        if (!token) return json({ error: "Zaloguj się ponownie." }, 401);

        const user = await verifyUser(token);
        if (!user) return json({ error: "Sesja wygasła. Zaloguj się ponownie." }, 401);

        let body: AnalyzeBody;
        try {
          body = (await request.json()) as AnalyzeBody;
        } catch {
          return json({ error: "Nieprawidłowe dane żądania." }, 400);
        }

        const inquiry = typeof body.inquiry === "string" ? body.inquiry.trim() : "";
        if (inquiry.length < 30) {
          return json({ error: "Wklej pełniejsze zapytanie klienta — minimum 30 znaków." }, 400);
        }
        if (inquiry.length > MAX_INQUIRY_CHARACTERS) {
          return json(
            { error: `Zapytanie jest zbyt długie. Maksymalnie ${MAX_INQUIRY_CHARACTERS} znaków.` },
            400,
          );
        }

        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
          return json({ error: "Administrator nie skonfigurował jeszcze klucza OpenAI." }, 503);
        }

        const model = process.env.OPENAI_MODEL || "gpt-5-mini";

        try {
          const usageCount = await getRecentUsageCount(token);
          if (usageCount >= HOURLY_LIMIT) {
            return json(
              { error: "Osiągnięto limit 10 analiz na godzinę. Spróbuj ponownie później." },
              429,
            );
          }
        } catch {
          return json(
            { error: "Brakuje konfiguracji licznika AI w Supabase. Uruchom najnowszą migrację." },
            503,
          );
        }

        let usageId = "";
        try {
          usageId = await createUsageRow(token, user.id, model, inquiry.length);

          const context = {
            existing_client_name:
              typeof body.clientName === "string" ? body.clientName.trim().slice(0, 200) : "",
            existing_client_email:
              typeof body.clientEmail === "string" ? body.clientEmail.trim().slice(0, 200) : "",
            existing_industry:
              typeof body.industry === "string" ? body.industry.trim().slice(0, 200) : "",
            client_inquiry: inquiry,
          };

          const openaiResponse = await fetch("https://api.openai.com/v1/responses", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model,
              store: false,
              max_output_tokens: 3500,
              input: [
                {
                  role: "developer",
                  content: [{ type: "input_text", text: developerInstructions }],
                },
                {
                  role: "user",
                  content: [
                    {
                      type: "input_text",
                      text: JSON.stringify(context),
                    },
                  ],
                },
              ],
              text: {
                format: {
                  type: "json_schema",
                  name: "offer_inquiry_analysis",
                  description: "Uporządkowana analiza zapytania klienta i szkic oferty.",
                  strict: true,
                  schema: analysisSchema,
                },
              },
            }),
          });

          const payload = (await openaiResponse.json()) as OpenAIResponse;
          if (!openaiResponse.ok) {
            await updateUsageRow(token, usageId, {
              status: "failed",
              error_code: payload.error?.code || `openai_${openaiResponse.status}`,
            });
            const message =
              openaiResponse.status === 429
                ? "Limit lub budżet OpenAI został wyczerpany."
                : "OpenAI nie wykonało analizy. Spróbuj ponownie.";
            return json({ error: message }, openaiResponse.status === 429 ? 429 : 502);
          }

          const outputText = extractOutputText(payload);
          if (!outputText) throw new Error("OPENAI_EMPTY_OUTPUT");

          const analysis = JSON.parse(outputText) as Record<string, unknown>;
          await updateUsageRow(token, usageId, {
            status: "completed",
            input_tokens: payload.usage?.input_tokens,
            output_tokens: payload.usage?.output_tokens,
          });

          return json({
            analysis: {
              ...analysis,
              generated_at: new Date().toISOString(),
              model,
            },
          });
        } catch (error) {
          if (usageId) {
            await updateUsageRow(token, usageId, {
              status: "failed",
              error_code: error instanceof Error ? error.message.slice(0, 120) : "unknown_error",
            });
          }
          console.error("AI inquiry analysis failed", error);
          return json({ error: "Nie udało się przeanalizować zapytania. Spróbuj ponownie." }, 500);
        }
      },
    },
  },
});
