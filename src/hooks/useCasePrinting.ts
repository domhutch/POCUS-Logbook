import { useRef, useState } from "react";
import { createCasePrintDocument } from "../domain/case-print";
import { createLogbookPrintDocument } from "../domain/logbook-print";
import type { LogbookCase, Pathway } from "../domain/logbook";

function messageFrom(cause: unknown, fallback: string) {
  return cause instanceof Error ? cause.message : fallback;
}

export function useCasePrinting(setError: (message: string | null) => void) {
  const [document, setDocument] = useState<string | null>(null);
  const [isFrameReady, setIsFrameReady] = useState(false);
  const frameRef = useRef<HTMLIFrameElement>(null);

  function printDocument(printableDocument: string, fallbackMessage: string) {
    setError(null);
    let printWindow: Window | null = null;
    try {
      printWindow = window.open("", "_blank");
      if (!printWindow) {
        setDocument(printableDocument);
        setIsFrameReady(false);
        return;
      }
      printWindow.document.open();
      printWindow.document.write(printableDocument);
      printWindow.document.close();
    } catch (cause) {
      printWindow?.close();
      setDocument(printableDocument);
      setIsFrameReady(false);
      setError(messageFrom(cause, fallbackMessage));
    }
  }

  function printCase(entry: LogbookCase) {
    try {
      printDocument(
        createCasePrintDocument(entry),
        "The printable case sheet could not be opened. Try again or use the browser's print controls.",
      );
    } catch (cause) {
      setError(messageFrom(cause, "The case PDF could not be created."));
    }
  }

  function printLogbook(cases: LogbookCase[], pathway: Pathway) {
    try {
      printDocument(
        createLogbookPrintDocument(cases, pathway),
        "The printable logbook could not be opened. Try again or use the browser's print controls.",
      );
    } catch (cause) {
      setError(messageFrom(cause, "The logbook PDF could not be created."));
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
    printLogbook,
    closePreview,
    printPreview,
    markFrameReady: () => setIsFrameReady(true),
  };
}
