import type { Offer } from "@/data/offers";
import { downloadOfferPdf as generateOfferPdf } from "@/lib/offer-pdf-generator";

type PdfInput = {
  offer: Offer;
  providerName: string;
  providerEmail?: string;
};

function isAppleMobileDevice() {
  const userAgent = navigator.userAgent;
  return (
    /iPad|iPhone|iPod/i.test(userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

function isMobileDevice() {
  return /Android|iPad|iPhone|iPod/i.test(navigator.userAgent) || navigator.maxTouchPoints > 1;
}

function fallbackDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = "noopener";
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export async function downloadOfferPdf(input: PdfInput) {
  if (typeof window === "undefined" || typeof document === "undefined") {
    throw new Error("PDF można wygenerować wyłącznie w przeglądarce.");
  }

  let capturedBlob: Blob | null = null;
  let capturedFilename = "oferta.pdf";

  const originalCreateObjectUrl = URL.createObjectURL;
  const originalAnchorClick = HTMLAnchorElement.prototype.click;

  URL.createObjectURL = ((object: Blob | MediaSource) => {
    if (object instanceof Blob && object.type === "application/pdf") {
      capturedBlob = object;
    }
    return originalCreateObjectUrl.call(URL, object);
  }) as typeof URL.createObjectURL;

  HTMLAnchorElement.prototype.click = function patchedAnchorClick() {
    if (this.download?.toLowerCase().endsWith(".pdf")) {
      capturedFilename = this.download;
      return;
    }
    return originalAnchorClick.call(this);
  };

  let generationPromise: Promise<void>;
  try {
    generationPromise = generateOfferPdf(input);
  } finally {
    URL.createObjectURL = originalCreateObjectUrl;
    HTMLAnchorElement.prototype.click = originalAnchorClick;
  }

  if (!capturedBlob) {
    await generationPromise;
    throw new Error("Nie udało się przygotować pliku PDF.");
  }

  const pdfBlob: Blob = capturedBlob;
  const file =
    typeof File !== "undefined"
      ? new File([pdfBlob], capturedFilename, {
          type: "application/pdf",
          lastModified: Date.now(),
        })
      : null;

  const shareData: ShareData | null = file
    ? {
        files: [file],
        title: `Oferta dla ${input.offer.client}`,
        text: `Oferta ${input.offer.number}`,
      }
    : null;

  if (isMobileDevice() && shareData && typeof navigator.share === "function") {
    let canShareFile = true;
    if (typeof navigator.canShare === "function") {
      try {
        canShareFile = navigator.canShare(shareData);
      } catch {
        canShareFile = false;
      }
    }

    if (canShareFile) {
      try {
        const sharePromise = navigator.share(shareData);
        await generationPromise;
        await sharePromise;
        return;
      } catch (shareError) {
        if (shareError instanceof DOMException && shareError.name === "AbortError") {
          throw new Error("Zapisywanie pliku PDF zostało anulowane.");
        }
      }
    }
  }

  await generationPromise;

  if (isAppleMobileDevice()) {
    const previewUrl = URL.createObjectURL(pdfBlob);
    window.location.assign(previewUrl);
    return;
  }

  fallbackDownload(pdfBlob, capturedFilename);
}
