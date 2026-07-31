import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, type FormEvent } from "react";
import { Building2, Loader2, Save, UserRound } from "lucide-react";
import { toast } from "sonner";
import { AppLayout } from "@/components/app-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  getProviderDisplayName,
  providerContactLines,
  saveProviderProfile,
  toProviderDocumentData,
  type ProviderProfileInput,
  type ProviderType,
} from "@/data/provider";
import { useProviderProfile } from "@/hooks/use-provider";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/provider")({
  head: () => ({
    meta: [
      { title: "Dane wykonawcy — AI Oferta" },
      {
        name: "description",
        content: "Dane freelancera, firmy lub agencji używane w ofertach i plikach PDF.",
      },
    ],
  }),
  component: ProviderSettings,
});

const emptyForm: ProviderProfileInput = {
  providerType: "freelancer",
  fullName: "",
  companyName: "",
  contactEmail: "",
  phone: "",
  website: "",
  taxId: "",
  address: "",
  bankAccount: "",
};

function ProviderTypeCard({
  type,
  current,
  icon: Icon,
  title,
  description,
  onSelect,
}: {
  type: ProviderType;
  current: ProviderType;
  icon: typeof UserRound;
  title: string;
  description: string;
  onSelect: (type: ProviderType) => void;
}) {
  const selected = current === type;
  return (
    <button
      type="button"
      onClick={() => onSelect(type)}
      aria-pressed={selected}
      className={cn(
        "rounded-2xl border p-5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        selected
          ? "border-primary bg-accent/70 shadow-soft"
          : "border-border bg-card hover:border-primary/40 hover:bg-secondary/50",
      )}
    >
      <span
        className={cn(
          "grid size-10 place-items-center rounded-xl",
          selected ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground",
        )}
      >
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <span className="mt-4 block font-semibold">{title}</span>
      <span className="mt-1 block text-sm leading-relaxed text-muted-foreground">{description}</span>
    </button>
  );
}

function ProviderSettings() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { data: profile, isLoading, error } = useProviderProfile();
  const [form, setForm] = useState<ProviderProfileInput>(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setForm({
      providerType: profile.providerType,
      fullName: profile.fullName,
      companyName: profile.companyName,
      contactEmail: profile.contactEmail || user?.email || "",
      phone: profile.phone,
      website: profile.website,
      taxId: profile.taxId,
      address: profile.address,
      bankAccount: profile.bankAccount,
    });
  }, [profile, user?.email]);

  function update<K extends keyof ProviderProfileInput>(key: K, value: ProviderProfileInput[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const fullName = form.fullName.trim();
    const companyName = form.companyName.trim();
    if (form.providerType === "freelancer" && !fullName) {
      toast.error("Podaj imię i nazwisko wykonawcy.");
      return;
    }
    if (form.providerType === "company" && !companyName) {
      toast.error("Podaj nazwę firmy lub agencji.");
      return;
    }
    if (form.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contactEmail)) {
      toast.error("Podaj poprawny adres e-mail.");
      return;
    }

    setSaving(true);
    try {
      const saved = await saveProviderProfile({
        ...form,
        fullName,
        companyName,
        contactEmail: form.contactEmail.trim(),
        phone: form.phone.trim(),
        website: form.website.trim(),
        taxId: form.taxId.trim(),
        address: form.address.trim(),
        bankAccount: form.bankAccount.trim(),
      });

      queryClient.setQueryData(["provider-profile"], saved);
      toast.success("Dane wykonawcy zostały zapisane.");
    } catch (saveError) {
      toast.error(
        saveError instanceof Error ? saveError.message : "Nie udało się zapisać danych wykonawcy.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center gap-3 rounded-xl border border-border bg-card p-12 text-sm text-muted-foreground">
          <Loader2 className="size-5 animate-spin" aria-hidden="true" />
          Pobieranie danych wykonawcy…
        </div>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout>
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6">
          <h1 className="text-2xl font-bold">Nie udało się otworzyć danych wykonawcy</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {error instanceof Error ? error.message : "Sprawdź konfigurację tabeli profiles w Supabase."}
          </p>
        </div>
      </AppLayout>
    );
  }

  const previewProfile = profile ? { ...profile, ...form } : null;
  const documentData = toProviderDocumentData(previewProfile, user);
  const contactLines = providerContactLines(documentData);

  return (
    <AppLayout>
      <div className="max-w-3xl">
        <p className="text-sm font-medium text-primary">Ustawienia dokumentów</p>
        <h1 className="mt-1 text-3xl font-bold">Dane wykonawcy</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          To są dane osoby, firmy albo agencji przygotowującej ofertę. Będą automatycznie używane w podglądzie oraz w każdym pobranym pliku PDF.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-8 grid gap-8 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <section className="rounded-2xl border border-border bg-card p-5 shadow-soft sm:p-6">
            <h2 className="text-lg font-semibold">Kim wystawiasz ofertę?</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Wybór zmienia pola formularza i sposób prezentowania danych w PDF.
            </p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <ProviderTypeCard
                type="freelancer"
                current={form.providerType}
                icon={UserRound}
                title="Freelancer / osoba fizyczna"
                description="Oferta podpisana Twoim imieniem i nazwiskiem. Nazwa marki jest opcjonalna."
                onSelect={(type) => update("providerType", type)}
              />
              <ProviderTypeCard
                type="company"
                current={form.providerType}
                icon={Building2}
                title="Firma lub agencja"
                description="Oferta wystawiona pod nazwą firmy z NIP-em, adresem i osobą kontaktową."
                onSelect={(type) => update("providerType", type)}
              />
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card p-5 shadow-soft sm:p-6">
            <h2 className="text-lg font-semibold">Tożsamość wykonawcy</h2>
            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              {form.providerType === "company" && (
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="companyName">Nazwa firmy lub agencji *</Label>
                  <Input
                    id="companyName"
                    value={form.companyName}
                    onChange={(event) => update("companyName", event.target.value)}
                    placeholder="Studio Nova sp. z o.o."
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="fullName">
                  {form.providerType === "company" ? "Osoba kontaktowa" : "Imię i nazwisko *"}
                </Label>
                <Input
                  id="fullName"
                  value={form.fullName}
                  onChange={(event) => update("fullName", event.target.value)}
                  placeholder="Jan Kowalski"
                />
              </div>

              {form.providerType === "freelancer" && (
                <div className="space-y-2">
                  <Label htmlFor="brandName">Nazwa marki — opcjonalnie</Label>
                  <Input
                    id="brandName"
                    value={form.companyName}
                    onChange={(event) => update("companyName", event.target.value)}
                    placeholder="Kowalski Web Design"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="contactEmail">E-mail kontaktowy</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  value={form.contactEmail}
                  onChange={(event) => update("contactEmail", event.target.value)}
                  placeholder="kontakt@twojafirma.pl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Telefon</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={form.phone}
                  onChange={(event) => update("phone", event.target.value)}
                  placeholder="+48 500 000 000"
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="website">Strona internetowa</Label>
                <Input
                  id="website"
                  value={form.website}
                  onChange={(event) => update("website", event.target.value)}
                  placeholder="https://twojafirma.pl"
                />
              </div>
            </div>
          </section>

          {form.providerType === "company" && (
            <section className="rounded-2xl border border-border bg-card p-5 shadow-soft sm:p-6">
              <h2 className="text-lg font-semibold">Dane formalne firmy</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Pola są opcjonalne, ale zwiększają wiarygodność dokumentu.
              </p>
              <div className="mt-5 grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="taxId">NIP</Label>
                  <Input
                    id="taxId"
                    value={form.taxId}
                    onChange={(event) => update("taxId", event.target.value)}
                    placeholder="1234567890"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bankAccount">Numer rachunku — opcjonalnie</Label>
                  <Input
                    id="bankAccount"
                    value={form.bankAccount}
                    onChange={(event) => update("bankAccount", event.target.value)}
                    placeholder="PL00 0000 0000 0000 0000 0000 0000"
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="address">Adres firmy</Label>
                  <Textarea
                    id="address"
                    rows={3}
                    value={form.address}
                    onChange={(event) => update("address", event.target.value)}
                    placeholder="ul. Przykładowa 10, 38-400 Krosno"
                  />
                </div>
              </div>
            </section>
          )}

          <div className="sticky bottom-3 z-20 rounded-2xl border border-border bg-background/95 p-3 shadow-lg backdrop-blur">
            <Button type="submit" className="w-full sm:w-auto" disabled={saving}>
              {saving ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <Save className="size-4" aria-hidden="true" />
              )}
              {saving ? "Zapisywanie…" : "Zapisz dane wykonawcy"}
            </Button>
          </div>
        </div>

        <aside className="h-fit rounded-2xl border border-border bg-card p-6 shadow-card xl:sticky xl:top-24">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Podgląd w ofercie</p>
          <div className="mt-5 min-w-0">
            <p className="break-words text-lg font-bold">{getProviderDisplayName(previewProfile, user)}</p>
            {contactLines.map((line) => (
              <p key={line} className="mt-1 break-words text-sm leading-relaxed text-muted-foreground">
                {line}
              </p>
            ))}
          </div>
          <div className="mt-6 rounded-xl bg-secondary/50 p-4 text-xs leading-relaxed text-muted-foreground">
            Dane klienta nadal wpisujesz osobno przy każdej ofercie. Ten formularz dotyczy wyłącznie Ciebie jako wykonawcy.
          </div>
        </aside>
      </form>
    </AppLayout>
  );
}
