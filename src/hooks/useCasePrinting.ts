import { useRef, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { Directory, Filesystem } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";
import { createCasePrintDocument } from "../domain/case-print";
import { createLogbookPrintDocument } from "../domain/logbook-print";
import type { LogbookCase, Pathway } from "../domain/logbook";

function errorMessage(cause: unknown, fallback: string) {
  return cause instanceof Error ? cause.message : fallback;
}

function toBase64(file: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("The PDF could not be prepared for sharing."));
    reader.onload = () => {
      if (typeof reader.result !== "string") {
        reject(new Error("The PDF could not be prepared for sharing."));
        return;
      }
      resolve(reader.result.slice(reader.result.indexOf(",") + 1));
    };
    reader.readAsDataURL(file);
  });
}

async function deliverPdf(file: Blob, filename: string) {
  if (Capacitor.isNativePlatform()) {
    if (!(await Share.canShare()).value) {
      throw new Error("Sharing is unavailable on this device.");
    }
    const saved = await Filesystem.writeFile({
      path: filename,
      data: await toBase64(file),
      directory: Directory.Cache,
    });
    await Share.share({
      title: filename.replace(/\.pdf$/i, ""),
      files: [saved.uri],
      dialogTitle: "Save or share PDF",
    });
    return "shared" as const;
  }

  const url = URL.createObjectURL(file);
  try {
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.append(link);
    link.click();
    link.remove();
  } finally {
    window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
  }
  return "downloaded" as const;
}

function isShareCancelled(cause: unknown) {
  return cause instanceof Error &&
    (cause.name === "AbortError" || /cancel(?:led|ed)?/i.test(cause.message));
}

export function useCasePrinting(setError: (message: string | null) => void) {
  const [document, setDocument] = useState<string | null>(null);
  const [isFrameReady, setIsFrameReady] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadStatus, setDownloadStatus] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [downloadInfo, setDownloadInfo] = useState<{
    filename: string;
    contentSelector: string;
  } | null>(null);
  const frameRef = useRef<HTMLIFrameElement>(null);

  function printDocument(
    printableDocument: string,
    filename: string,
    contentSelector: string,
  ) {
    setError(null);
    setDownloadStatus(null);
    setDownloadError(null);
    setDownloadInfo({ filename, contentSelector });
    setDocument(printableDocument.replace(
      "</head>",
      "<style>.toolbar{display:none!important}</style></head>",
    ));
    setIsFrameReady(false);
  }

  function printCase(entry: LogbookCase) {
    try {
      printDocument(
        createCasePrintDocument(entry),
        `pocus-${entry.pathway}-case-${entry.date}.pdf`,
        ".sheet",
      );
    } catch (cause) {
      setError(errorMessage(cause, "The case PDF could not be created."));
    }
  }

  function printLogbook(cases: LogbookCase[], pathway: Pathway) {
    try {
      printDocument(
        createLogbookPrintDocument(cases, pathway),
        `pocus-${pathway}-logbook.pdf`,
        "main",
      );
    } catch (cause) {
      setError(errorMessage(cause, "The logbook PDF could not be created."));
    }
  }

  function closePreview() {
    setDocument(null);
    setIsFrameReady(false);
    setIsDownloading(false);
    setDownloadStatus(null);
    setDownloadError(null);
    setDownloadInfo(null);
  }

  function printPreview() {
    const printWindow = frameRef.current?.contentWindow;
    if (!printWindow) {
      setDownloadError("The print preview is not ready yet. Wait a moment and try again.");
      return;
    }
    try {
      setDownloadError(null);
      printWindow.focus();
      printWindow.print();
    } catch (cause) {
      setDownloadError(errorMessage(cause, "The print dialog could not be opened."));
    }
  }

  async function downloadPdf() {
    const sourceDocument = frameRef.current?.contentDocument;
    const target = downloadInfo && sourceDocument?.querySelector(downloadInfo.contentSelector);
    if (!sourceDocument || !target || !downloadInfo) {
      setDownloadError("The PDF preview is not ready yet. Wait a moment and try again.");
      return;
    }

    setIsDownloading(true);
    setDownloadStatus(null);
    setDownloadError(null);
    setError(null);
    const captureStyle = sourceDocument.createElement("style");
    captureStyle.textContent = `
      body { margin: 0 !important; padding: 0 !important; background: #fff !important; }
      .toolbar { display: none !important; }
      .sheet { padding: 0 !important; border: 0 !important; box-shadow: none !important; }
      .logbook-page { min-height: 0 !important; margin: 0 !important; padding: 0 !important; box-shadow: none !important; }
    `;
    sourceDocument.head.append(captureStyle);
    try {
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import("html2canvas"),
        import("jspdf"),
      ]);
      const pageElements =
        downloadInfo.contentSelector === "main"
          ? Array.from(target.querySelectorAll<HTMLElement>(".logbook-page"))
          : [target as HTMLElement];
      if (pageElements.length === 0) {
        throw new Error("The PDF preview does not contain any printable pages.");
      }
      const margin = downloadInfo.contentSelector === "main" ? 10 : 8;
      const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const contentWidth = pageWidth - margin * 2;
      const contentHeight = pageHeight - margin * 2;

      for (const [index, page] of pageElements.entries()) {
        if (index > 0) pdf.addPage();
        const canvas = await html2canvas(page, {
          scale: 2,
          useCORS: true,
          backgroundColor: "#ffffff",
          logging: false,
        });
        const scale = Math.min(
          contentWidth / canvas.width,
          contentHeight / canvas.height,
        );
        const width = canvas.width * scale;
        const height = canvas.height * scale;
        pdf.addImage(
          canvas.toDataURL("image/jpeg", 0.96),
          "JPEG",
          (pageWidth - width) / 2,
          margin,
          width,
          height,
        );
      }
      const file = pdf.output("blob");
      const delivery = await deliverPdf(file, downloadInfo.filename);
      setDownloadStatus(
        delivery === "shared"
          ? "PDF ready in the share sheet. Choose Save to Files or another destination."
          : "PDF download started.",
      );
    } catch (cause) {
      setDownloadStatus(
        isShareCancelled(cause)
          ? "Sharing was cancelled. No save was confirmed."
          : null,
      );
      if (!isShareCancelled(cause)) {
        setDownloadError(errorMessage(cause, "The PDF could not be created or downloaded."));
      }
    } finally {
      captureStyle.remove();
      setIsDownloading(false);
    }
  }

  return {
    document,
    isFrameReady,
    isDownloading,
    downloadStatus,
    downloadError,
    frameRef,
    printCase,
    printLogbook,
    closePreview,
    printPreview,
    downloadPdf,
    markFrameReady: () => setIsFrameReady(true),
  };
}
