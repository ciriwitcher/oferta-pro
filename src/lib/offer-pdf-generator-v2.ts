import type { Offer } from "@/data/offers";
import { formatDate, formatPrice } from "@/data/offers";
import { providerContactLines, type ProviderDocumentData } from "@/data/provider";

const PAGE_WIDTH = 1240;
const PAGE_HEIGHT = 1754;
const MARGIN = 96;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const PDF_WIDTH = 595.28;
const PDF_HEIGHT = 841.89;

const palette = {
  ink: "#102235",
  muted: "#637487",
  primary: "#06b6d4",
  primaryDark: "#087f9b",
  warning: "#9a6700",
  line: "#dce5ec",
  soft: "#f2f8fb",
  warningSoft: "#fff8df",
  white: "#ffffff",
};

type PdfInput = {
  offer: Offer;
  provider: ProviderDocumentData;
};

type Page = {
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
};

function encode(value: string) {
  return new TextEncoder().encode(value);
}

function dataUrlToBytes(dataUrl: string) {
  const binary = atob(dataUrl.split(",")[1] ?? "");
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

function sanitizeFilename(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9-_]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70);
}

function splitItems(value: string) {
  const lineItems = value
    .split(/\n+/)
    .map((item) => item.trim())
    .filter(Boolean);
  if (lineItems.length > 1) return lineItems;
  return value
    .split(/;+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function buildPdf(images: Uint8Array[]) {
  const chunks: Uint8Array[] = [];
  const offsets: number[] = [];
  let length = 0;

  const push = (chunk: string | Uint8Array) => {
    const bytes = typeof chunk === "string" ? encode(chunk) : chunk;
    chunks.push(bytes);
    length += bytes.length;
  };
  const startObject = (number: number) => {
    offsets[number] = length;
    push(`${number} 0 obj\n`);
  };
  const endObject = () => push("\nendobj\n");

  const pageNumbers = images.map((_, index) => 3 + index * 3);
  const totalObjects = 2 + images.length * 3;

  push("%PDF-1.4\n%AI-Oferta\n");
  startObject(1);
  push("<< /Type /Catalog /Pages 2 0 R >>");
  endObject();
  startObject(2);
  push(`<< /Type /Pages /Count ${images.length} /Kids [${pageNumbers.map((n) => `${n} 0 R`).join(" ")}] >>`);
  endObject();

  images.forEach((image, index) => {
    const pageObject = 3 + index * 3;
    const imageObject = pageObject + 1;
    const contentObject = pageObject + 2;
    const imageName = `Im${index + 1}`;
    const content = `q\n${PDF_WIDTH} 0 0 ${PDF_HEIGHT} 0 0 cm\n/${imageName} Do\nQ`;

    startObject(pageObject);
    push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PDF_WIDTH} ${PDF_HEIGHT}] /Resources << /XObject << /${imageName} ${imageObject} 0 R >> >> /Contents ${contentObject} 0 R >>`);
    endObject();

    startObject(imageObject);
    push(`<< /Type /XObject /Subtype /Image /Width ${PAGE_WIDTH} /Height ${PAGE_HEIGHT} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${image.length} >>\nstream\n`);
    push(image);
    push("\nendstream");
    endObject();

    const contentBytes = encode(content);
    startObject(contentObject);
    push(`<< /Length ${contentBytes.length} >>\nstream\n`);
    push(contentBytes);
    push("\nendstream");
    endObject();
  });

  const xrefOffset = length;
  push(`xref\n0 ${totalObjects + 1}\n`);
  push("0000000000 65535 f \n");
  for (let number = 1; number <= totalObjects; number += 1) {
    push(`${String(offsets[number] ?? 0).padStart(10, "0")} 00000 n \n`);
  }
  push(`trailer\n<< /Size ${totalObjects + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`);
  return new Blob(chunks, { type: "application/pdf" });
}

export async function downloadOfferPdf({ offer, provider }: PdfInput) {
  if (typeof document === "undefined") throw new Error("PDF można wygenerować wyłącznie w przeglądarce.");

  const pages: Page[] = [];
  let page: Page;
  let y = 0;
  const ai = offer.aiAnalysis;
  const contactLines = providerContactLines(provider);

  function font(size: number, weight: 400 | 500 | 600 | 700 = 400) {
    page.context.font = `${weight} ${size}px Arial, Helvetica, sans-serif`;
  }

  function createPage() {
    const canvas = document.createElement("canvas");
    canvas.width = PAGE_WIDTH;
    canvas.height = PAGE_HEIGHT;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Przeglądarka nie obsługuje generowania PDF.");

    context.fillStyle = palette.white;
    context.fillRect(0, 0, PAGE_WIDTH, PAGE_HEIGHT);
    context.textBaseline = "top";
    context.fillStyle = palette.primary;
    context.fillRect(0, 0, PAGE_WIDTH, 18);

    context.font = "700 22px Arial, Helvetica, sans-serif";
    context.fillStyle = palette.ink;
    context.fillText(provider.name, MARGIN, 55);
    context.font = "500 17px Arial, Helvetica, sans-serif";
    context.fillStyle = palette.muted;
    context.textAlign = "right";
    context.fillText(offer.number, PAGE_WIDTH - MARGIN, 58);
    context.textAlign = "left";
    context.strokeStyle = palette.line;
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(MARGIN, 106);
    context.lineTo(PAGE_WIDTH - MARGIN, 106);
    context.stroke();

    page = { canvas, context };
    pages.push(page);
    y = 142;
  }

  function ensureSpace(height: number) {
    if (y + height > PAGE_HEIGHT - 120) createPage();
  }

  function wrap(value: string, maxWidth: number) {
    const lines: string[] = [];
    String(value || "—")
      .split("\n")
      .forEach((paragraph, paragraphIndex, paragraphs) => {
        const words = paragraph.trim().split(/\s+/).filter(Boolean);
        if (!words.length) lines.push("");
        let current = "";
        words.forEach((word) => {
          const candidate = current ? `${current} ${word}` : word;
          if (!current || page.context.measureText(candidate).width <= maxWidth) current = candidate;
          else {
            lines.push(current);
            current = word;
          }
        });
        if (current) lines.push(current);
        if (paragraphIndex < paragraphs.length - 1) lines.push("");
      });
    return lines;
  }

  function text(
    value: string,
    options: {
      size?: number;
      weight?: 400 | 500 | 600 | 700;
      color?: string;
      lineHeight?: number;
      x?: number;
      width?: number;
    } = {},
  ) {
    const size = options.size ?? 22;
    const weight = options.weight ?? 400;
    const lineHeight = options.lineHeight ?? Math.round(size * 1.5);
    const x = options.x ?? MARGIN;
    const width = options.width ?? CONTENT_WIDTH;
    font(size, weight);
    wrap(value, width).forEach((line) => {
      ensureSpace(lineHeight + 6);
      font(size, weight);
      page.context.fillStyle = options.color ?? palette.ink;
      page.context.fillText(line || " ", x, y);
      y += lineHeight;
    });
  }

  function sectionTitle(title: string, color = palette.primaryDark) {
    ensureSpace(70);
    y += 18;
    font(18, 700);
    page.context.fillStyle = color;
    page.context.fillText(title.toUpperCase(), MARGIN, y);
    y += 38;
  }

  function paragraph(title: string, value: string) {
    if (!value.trim()) return;
    sectionTitle(title);
    text(value, { size: 22, lineHeight: 34 });
    y += 10;
  }

  function bullets(title: string, items: string[], fallback = "", warning = false) {
    const values = items.filter(Boolean);
    if (!values.length && !fallback) return;

    sectionTitle(title, warning ? palette.warning : palette.primaryDark);
    (values.length ? values : [fallback]).forEach((item) => {
      font(22, 400);
      const lines = wrap(item, CONTENT_WIDTH - 34);
      const height = Math.max(34, lines.length * 34) + 10;
      ensureSpace(height);
      page.context.fillStyle = warning ? palette.warning : palette.primary;
      page.context.beginPath();
      page.context.arc(MARGIN + 7, y + 13, 5, 0, Math.PI * 2);
      page.context.fill();
      font(22, 400);
      page.context.fillStyle = palette.ink;
      lines.forEach((line, index) => page.context.fillText(line, MARGIN + 34, y + index * 34));
      y += height;
    });
    y += 4;
  }

  createPage();
  font(18, 700);
  page.context.fillStyle = palette.primaryDark;
  page.context.fillText("OFERTA WSPÓŁPRACY", MARGIN, y);
  y += 46;
  text(offer.service || "Propozycja współpracy", { size: 43, weight: 700, lineHeight: 54 });
  y += 8;
  text(`Przygotowana przez ${provider.name} dla ${offer.client}`, {
    size: 21,
    color: palette.muted,
    lineHeight: 32,
  });
  y += 30;

  ensureSpace(178);
  page.context.fillStyle = palette.soft;
  page.context.beginPath();
  page.context.roundRect(MARGIN, y, CONTENT_WIDTH, 154, 20);
  page.context.fill();

  const validUntil = new Date(offer.createdAt);
  validUntil.setDate(validUntil.getDate() + 30);
  const meta = [
    ["KLIENT", offer.client],
    ["DATA OFERTY", formatDate(offer.createdAt)],
    ["WAŻNA DO", formatDate(validUntil.toISOString())],
  ];
  const columnWidth = CONTENT_WIDTH / 3;
  meta.forEach(([label, value], index) => {
    const x = MARGIN + index * columnWidth + 26;
    page.context.font = "700 15px Arial, Helvetica, sans-serif";
    page.context.fillStyle = palette.muted;
    page.context.fillText(label, x, y + 28);
    page.context.font = "600 21px Arial, Helvetica, sans-serif";
    page.context.fillStyle = palette.ink;
    const words = value.split(/\s+/);
    const first = words.slice(0, 3).join(" ");
    const second = words.slice(3).join(" ");
    page.context.fillText(first, x, y + 66);
    if (second) page.context.fillText(second, x, y + 95);
  });
  y += 184;

  const clientDetails = [offer.client, offer.industry, offer.clientEmail].filter(Boolean).join(" · ");
  paragraph("Dane klienta", clientDetails);
  paragraph(
    "Propozycja współpracy",
    ai?.professionalOfferText ||
      "Poniższa propozycja porządkuje potrzeby projektu, rekomendowane rozwiązanie, zakres odpowiedzialności, termin oraz koszt realizacji.",
  );
  paragraph("Cel projektu", ai?.projectGoal || "");
  paragraph("Sytuacja i potrzeba klienta", ai?.problemSummary || offer.problem);
  paragraph("Proponowane rozwiązanie", ai?.proposedSolution || offer.service || "Do ustalenia");
  bullets("Zakres prac", splitItems(offer.scope), "Zakres nie został jeszcze uzupełniony.");
  bullets("Rezultaty dla klienta", ai?.resultItems || []);
  bullets("Elementy niewchodzące w zakres", ai?.exclusionItems || []);

  ensureSpace(210);
  y += 18;
  page.context.fillStyle = palette.ink;
  page.context.beginPath();
  page.context.roundRect(MARGIN, y, CONTENT_WIDTH, 176, 20);
  page.context.fill();
  page.context.font = "700 15px Arial, Helvetica, sans-serif";
  page.context.fillStyle = "#b9cbd5";
  page.context.fillText("TERMIN REALIZACJI", MARGIN + 34, y + 32);
  page.context.fillText("CENA CAŁKOWITA", MARGIN + CONTENT_WIDTH / 2 + 34, y + 32);
  page.context.font = "600 24px Arial, Helvetica, sans-serif";
  page.context.fillStyle = palette.white;
  page.context.fillText(offer.deliveryTime || "Do ustalenia", MARGIN + 34, y + 76, CONTENT_WIDTH / 2 - 68);
  page.context.font = "700 34px Arial, Helvetica, sans-serif";
  page.context.fillText(formatPrice(offer.price), MARGIN + CONTENT_WIDTH / 2 + 34, y + 74);
  y += 206;

  if (ai?.clarifyingQuestions.length) {
    ensureSpace(80);
    page.context.fillStyle = palette.warningSoft;
    page.context.beginPath();
    page.context.roundRect(MARGIN, y + 12, CONTENT_WIDTH, 54, 14);
    page.context.fill();
    y += 24;
    font(17, 700);
    page.context.fillStyle = palette.warning;
    page.context.fillText("KWESTIE DO POTWIERDZENIA PRZED ROZPOCZĘCIEM", MARGIN + 22, y);
    y += 42;
    bullets("Do potwierdzenia", ai.clarifyingQuestions, "", true);
  }

  bullets(
    "Warunki i założenia",
    splitItems(offer.notes),
    "Szczegółowe warunki współpracy zostaną potwierdzone przed rozpoczęciem prac.",
  );
  bullets(
    "Kolejne kroki",
    [
      "Potwierdzenie zakresu, ceny, terminu oraz otwartych kwestii.",
      "Akceptacja oferty i warunków rozpoczęcia prac.",
      "Przekazanie materiałów i rozpoczęcie projektu.",
    ],
  );

  ensureSpace(170 + contactLines.length * 28);
  y += 30;
  page.context.strokeStyle = palette.line;
  page.context.lineWidth = 2;
  page.context.beginPath();
  page.context.moveTo(MARGIN, y);
  page.context.lineTo(PAGE_WIDTH - MARGIN, y);
  page.context.stroke();
  y += 28;
  text(provider.name, { size: 21, weight: 700, lineHeight: 30 });
  contactLines.forEach((line) => text(line, { size: 17, color: palette.muted, lineHeight: 25 }));

  pages.forEach(({ context }, index) => {
    context.font = "500 15px Arial, Helvetica, sans-serif";
    context.fillStyle = palette.muted;
    context.textAlign = "right";
    context.fillText(`Strona ${index + 1} z ${pages.length}`, PAGE_WIDTH - MARGIN, PAGE_HEIGHT - 64);
    context.textAlign = "left";
  });

  const images = pages.map(({ canvas }) => dataUrlToBytes(canvas.toDataURL("image/jpeg", 0.93)));
  const blob = buildPdf(images);
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `oferta-${sanitizeFilename(offer.client || offer.number) || "klient"}.pdf`;
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
}
