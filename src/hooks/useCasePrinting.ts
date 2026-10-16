import { useRef, useState } from "react";
import { createCasePrintDocument } from "../domain/case-print";
import type { LogbookCase } from "../domain/logbook";

function messageFrom(cause: unknown, fallback: string) {
  return cause instanceof Error ? cause.message : fallback;
}

export function useCasePrinting(setError: (message: string | null) => void) {
  const [document, setDocument] = useState<string | null>(null);
  const [isFrameReady, setIsFrameReady] = useState(false);
  const frameRef = useRef<HTMLIFrameElement>(null);

  function printCase(entry: LogbookCase) {
    setError(null);
    const printableDocument = createCasePrintDocument(entry);
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      setDocument(printableDocument);
      setIsFrameReady(false);
      return;
    }

    try {
      printWindow.document.open();
      printWindow.document.write(printableDocument);
      printWindow.document.close();
      window.setTimeout(() => {
        printWindow.focus();
        printWindow.print();
      }, 250);
    } catch (cause) {
      printWindow.close();
      setError(messageFrom(cause, "The printable case sheet could not be opened."));
    }
  }

  function closePreview() {
    setDocument(null);
    setIsFrameReady(false);
  }

  function printPreview() {
    const printWindow = frameRef.current?.contentWindow;
    if (!printWindow) {
      setError("The print preview is not ready yet. Wait a moment and try again.");
      return;
    }
    try {
      printWindow.focus();
      printWindow.print();
    } catch (cause) {
      setError(messageFrom(cause, "The case print dialog could not be opened."));
    }
  }

  return {
    document,
    isFrameReady,
    frameRef,
    printCase,
    closePreview,
    printPreview,
    markFrameReady: () => setIsFrameReady(true),
  };
}
