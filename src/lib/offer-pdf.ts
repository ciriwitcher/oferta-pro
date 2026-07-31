import type { Offer } from "@/data/offers";
import { formatDate, formatPrice } from "@/data/offers";

const PAGE_WIDTH = 1240;
const PAGE_HEIGHT = 1754;
const PAGE_MARGIN = 96;
const CONTENT_WIDTH = PAGE_WIDTH - PAGE_MARGIN * 2;
const PDF_WIDTH = 595.28;
const PDF_HEIGHT = 841.89;

const colors = {
  ink: "#102235",
  muted: "#627386",
  primary: "#08b8df",
  primaryDark: "#047f9f",
  line: "#dce5ec",
  soft: "#f3f8fb",
  white: "#ffffff",
};

type PdfInput = {
  offer: Offer;
  providerName: string;
  providerEmail?: string;
};

type Page = {
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
};

function splitItems(value: string) {
  const lines = value
    .split(/\n+/)
    .map((item) => item.trim())
    .filter(Boolean);

  if (lines.length > 1) return lines;

  return value
    .split(/;+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function sanitizeFilename(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9-_]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70);
}

function dataUrlToBytes(dataUrl: string) {
  const base64 = dataUrl.split(",")[1] ?? "";
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

function encode(value: string) {
  return new TextEncoder().encode(value);
}

function buildPdf(images: Uint8Array[]) {
  const chunks: Uint8Array[] = [];
  const offsets: number[] = [];
  let byteLength = 0;

  function push(chunk: string | Uint8Array) {
    const bytes = typeof chunk === "string" ? encode(chunk) : chunk;
    chunks.push(bytes);
    byteLength += bytes.length;
  }

  function startObject(number: number) {
    offsets[number] = byteLength;
    push(`${number} 0 obj\n`);
  }

  function endObject() {
    push("\nendobj\n");
  }

  const totalObjects = 2 + images.length * 3;
  const pageObjectNumbers = images.map((_, index) => 3 + index * 3);

  push("%PDF-1.4\n%AI-Oferta\n");

  startObject(1);
  push("<< /Type /Catalog /Pages 2 0 R >>");
  endObject();

  startObject(2);
  push(
    `<< /Type /Pages /Count ${images.length} /Kids [${pageObjectNumbers
      .map((number) => `${number} 0 R`)
      .join(" ")}] >>`,
  );
  endObject();

  images.forEach((image, index) => {
    const pageObject = 3 + index * 3;
    const imageObject = pageObject + 1;
    const contentObject = pageObject + 2;
    const imageName = `Im${index + 1}`;
    const content = `q\n${PDF_WIDTH} 0 0 ${PDF_HEIGHT} 0 0 cm\n/${imageName} Do\nQ`;

    startObject(pageObject);
    push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PDF_WIDTH} ${PDF_HEIGHT}] /Resources << /XObject << /${imageName} ${imageObject} 0 R >> >> /Contents ${contentObject} 0 R >>`,
    );
    endObject();

    startObject(imageObject);
    push(
      `<< /Type /XObject /Subtype /Image /Width ${PAGE_WIDTH} /Height ${PAGE_HEIGHT} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${image.length} >>\nstream\n`,
    );
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

  const xrefOffset = byteLength;
  push(`xref\n0 ${totalObjects + 1}\n`);
  push("0000000000 65535 f \n");
  for (let number = 1; number <= totalObjects; number += 1) {
    push(`${String(offsets[number] ?? 0).padStart(10, "0")} 00000 n \n`);
  }
  push(`trailer\n<< /Size ${totalObjects + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`);

  return new Blob(chunks, { type: "application/pdf" });
}

export async function downloadOfferPdf({ offer, providerName, providerEmail }: PdfInput) {
  if (typeof document === "undefined") {
    throw new Error("PDF można wygenerować wyłącznie w przeglądarce.");
  }

  const pages: Page[] = [];
  let page: Page;
  let y = 0;

  function createPage() {
    const canvas = document.createElement("canvas");
    canvas.width = PAGE_WIDTH;
    canvas.height = PAGE_HEIGHT;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Przeglądarka nie obsługuje generowania PDF.");

    context.fillStyle = colors.white;
    context.fillRect(0, 0, PAGE_WIDTH, PAGE_HEIGHT);
    context.textBaseline = "top";

    context.fillStyle = colors.primary;
    context.fillRect(0, 0, PAGE_WIDTH, 18);

    context.font = "700 22px Arial, Helvetica, sans-serif";
    context.fillStyle = colors.ink;
    context.fillText("AI Oferta", PAGE_MARGIN, 54);

    context.font = "500 17px Arial, Helvetica, sans-serif";
    context.fillStyle = colors.muted;
    context.textAlign = "right";
    context.fillText(offer.number, PAGE_WIDTH - PAGE_MARGIN, 58);
    context.textAlign = "left";

    context.strokeStyle = colors.line;
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(PAGE_MARGIN, 96);
    context.lineTo(PAGE_WIDTH - PAGE_MARGIN, 96);
    context.stroke();

    const nextPage = { canvas, context };
    pages.push(nextPage);
    page = nextPage;
    y = 130;
  }

  function ensureSpace(requiredHeight: number) {
    if (y + requiredHeight > PAGE_HEIGHT - 120) createPage();
  }

  function font(size: number, weight: 400 | 500 | 600 | 700 = 400) {
    page.context.font = `${weight} ${size}px Arial, Helvetica, sans-serif`;
  }

  function wrapLines(text: string, maxWidth: number) {
    const paragraphs = String(text || "—").split("\n");
    const lines: string[] = [];

    paragraphs.forEach((paragraph, paragraphIndex) => {
      const words = paragraph.trim().split(/\s+/).filter(Boolean);
      if (!words.length) {
        lines.push("");
        return;
      }

      let current = "";
      words.forEach((word) => {
        const candidate = current ? `${current} ${word}` : word;
        if (page.context.measureText(candidate).width <= maxWidth || !current) {
          current = candidate;
        } else {
          lines.push(current);
          current = word;
        }
      });
      if (current) lines.push(current);
      if (paragraphIndex < paragraphs.length - 1) lines.push("");
    });

    return lines;
  }

  function drawWrappedText(
    text: string,
    x: number,
    maxWidth: number,
    options: { size?: number; weight?: 400 | 500 | 600 | 700; color?: string; lineHeight?: number } = {},
  ) {
    const size = options.size ?? 22;
    const weight = options.weight ?? 400;
    const lineHeight = options.lineHeight ?? Math.round(size * 1.48);
    font(size, weight);
    page.context.fillStyle = options.color ?? colors.ink;
    const lines = wrapLines(text, maxWidth);

    lines.forEach((line) => {
      ensureSpace(lineHeight + 8);
      font(size, weight);
      page.context.fillStyle = options.color ?? colors.ink;
      page.context.fillText(line || " ", x, y);
      y += lineHeight;
    });
  }

  function drawSectionTitle(title: string) {
    ensureSpace(72);
    y += 20;
    font(18, 700);
    page.context.fillStyle = colors.primaryDark;
    page.context.fillText(title.toUpperCase(), PAGE_MARGIN, y);
    y += 38;
  }

  function drawParagraph(title: string, value: string) {
    drawSectionTitle(title);
    drawWrappedText(value || "—", PAGE_MARGIN, CONTENT_WIDTH, {
      size: 22,
      color: colors.ink,
      lineHeight: 34,
    });
    y += 12;
  }

  function drawBullets(title: string, values: string[], fallback: string) {
    drawSectionTitle(title);
    const items = values.length ? values : [fallback];
    items.forEach((item) => {
      font(22, 400);
      const bulletWidth = 30;
      const lines = wrapLines(item, CONTENT_WIDTH - bulletWidth);
      const itemHeight = Math.max(34, lines.length * 34) + 10;
      ensureSpace(itemHeight);
      font(22, 400);

      page.context.fillStyle = colors.primary;
      page.context.beginPath();
      page.context.arc(PAGE_MARGIN + 7, y + 13, 5, 0, Math.PI * 2);
      page.context.fill();

      page.context.fillStyle = colors.ink;
      lines.forEach((line, index) => {
        page.context.fillText(line, PAGE_MARGIN + bulletWidth, y + index * 34);
      });
      y += itemHeight;
    });
    y += 6;
  }

  createPage();

  font(18, 700);
  page.context.fillStyle = colors.primaryDark;
  page.context.fillText("OFERTA WSPÓŁPRACY", PAGE_MARGIN, y);
  y += 46;

  drawWrappedText(offer.service || "Propozycja współpracy", PAGE_MARGIN, CONTENT_WIDTH, {
    size: 43,
    weight: 700,
    color: colors.ink,
    lineHeight: 54,
  });
  y += 10;
  drawWrappedText(`Przygotowana przez ${providerName} dla ${offer.client}`, PAGE_MARGIN, CONTENT_WIDTH, {
    size: 21,
    color: colors.muted,
    lineHeight: 32,
  });
  y += 34;

  ensureSpace(185);
  page.context.fillStyle = colors.soft;
  page.context.beginPath();
  page.context.roundRect(PAGE_MARGIN, y, CONTENT_WIDTH, 158, 20);
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
    const x = PAGE_MARGIN + index * columnWidth + 28;
    font(15, 700);
    page.context.fillStyle = colors.muted;
    page.context.fillText(label, x, y + 30);
    font(21, 600);
    page.context.fillStyle = colors.ink;
    const lines = wrapLines(value, columnWidth - 56).slice(0, 2);
    lines.forEach((line, lineIndex) => page.context.fillText(line, x, y + 68 + lineIndex * 29));
  });
  y += 190;

  const clientDetails = [offer.client, offer.industry, offer.clientEmail].filter(Boolean).join(" · ");
  drawParagraph("Dane klienta", clientDetails);
  drawParagraph("Sytuacja i potrzeba klienta", offer.problem);
  drawParagraph("Proponowane rozwiązanie", offer.service || "Do ustalenia");
  drawBullets("Zakres i rezultaty", splitItems(offer.scope), "Zakres nie został jeszcze uzupełniony.");

  ensureSpace(210);
  y += 20;
  page.context.fillStyle = colors.ink;
  page.context.beginPath();
  page.context.roundRect(PAGE_MARGIN, y, CONTENT_WIDTH, 178, 20);
  page.context.fill();

  font(15, 700);
  page.context.fillStyle = "#a9c0cf";
  page.context.fillText("TERMIN REALIZACJI", PAGE_MARGIN + 34, y + 34);
  page.context.fillText("CENA CAŁKOWITA", PAGE_MARGIN + CONTENT_WIDTH / 2 + 34, y + 34);

  font(24, 600);
  page.context.fillStyle = colors.white;
  const deadlineLines = wrapLines(offer.deliveryTime || "Do ustalenia", CONTENT_WIDTH / 2 - 70).slice(0, 2);
  deadlineLines.forEach((line, index) => page.context.fillText(line, PAGE_MARGIN + 34, y + 76 + index * 34));

  font(34, 700);
  page.context.fillStyle = colors.white;
  page.context.fillText(formatPrice(offer.price), PAGE_MARGIN + CONTENT_WIDTH / 2 + 34, y + 78);
  y += 210;

  drawBullets(
    "Warunki i założenia",
    splitItems(offer.notes),
    "Szczegółowe warunki płatności, materiały, poprawki i elementy niewchodzące w cenę zostaną potwierdzone przed rozpoczęciem prac.",
  );
  drawBullets(
    "Kolejne kroki",
    [
      "Potwierdzenie zakresu, ceny i terminu realizacji.",
      "Akceptacja oferty oraz warunków rozpoczęcia prac.",
      "Przekazanie materiałów i rozpoczęcie projektu.",
    ],
    "",
  );

  ensureSpace(130);
  y += 30;
  page.context.strokeStyle = colors.line;
  page.context.lineWidth = 2;
  page.context.beginPath();
  page.context.moveTo(PAGE_MARGIN, y);
  page.context.lineTo(PAGE_WIDTH - PAGE_MARGIN, y);
  page.context.stroke();
  y += 30;
  font(20, 700);
  page.context.fillStyle = colors.ink;
  page.context.fillText(providerName, PAGE_MARGIN, y);
  if (providerEmail) {
    font(18, 400);
    page.context.fillStyle = colors.muted;
    page.context.fillText(providerEmail, PAGE_MARGIN, y + 31);
  }

  pages.forEach(({ context }, index) => {
    context.font = "500 15px Arial, Helvetica, sans-serif";
    context.fillStyle = colors.muted;
    context.textAlign = "right";
    context.fillText(`Strona ${index + 1} z ${pages.length}`, PAGE_WIDTH - PAGE_MARGIN, PAGE_HEIGHT - 64);
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
