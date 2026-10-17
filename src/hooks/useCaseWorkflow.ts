import { useRef, useState } from "react";
import {
  createDraft,
  type CaseDraft,
  type LogbookCase,
  type Pathway,
} from "../domain/logbook";
import { deleteCase, saveCase, type AppSettings } from "../storage/logbook-store";

export type Page = "overview" | "cases" | "metrics" | "settings" | "form" | "review";

type UseCaseWorkflowOptions = {
  activePathway: Pathway;
  appSettings: AppSettings;
  refreshEntries: () => Promise<void>;
  setError: (message: string | null) => void;
};

export function useCaseWorkflow({
  activePathway,
  appSettings,
  refreshEntries,
  setError,
}: UseCaseWorkflowOptions) {
  const [activePage, setActivePage] = useState<Page>("overview");
  const [returnPage, setReturnPage] = useState<Exclude<Page, "form">>("overview");
  const [draft, setDraft] = useState<CaseDraft | null>(null);
  const initialDraftRef = useRef<string | null>(null);
  const [caseSaveStatus, setCaseSaveStatus] = useState<string | null>(null);
  const [reviewedCase, setReviewedCase] = useState<LogbookCase | null>(null);

  function startNewCase() {
    setCaseSaveStatus(null);
    setReturnPage(activePage === "form" ? "overview" : activePage);
    const newDraft = createDraft(activePathway);
    if (newDraft.pathway === "heart") newDraft.operatorName = appSettings.operatorName;
    initialDraftRef.current = JSON.stringify(newDraft);
    setDraft(newDraft);
    setActivePage("form");
  }

  function startEditing(entry: LogbookCase) {
    setCaseSaveStatus(null);
    setReturnPage("cases");
    const editedDraft = { ...entry };
    initialDraftRef.current = JSON.stringify(editedDraft);
    setDraft(editedDraft);
    setReviewedCase(null);
    setActivePage("form");
  }

  function startReviewing(entry: LogbookCase) {
    setReviewedCase(entry);
    setActivePage("review");
  }

  function closeReview() {
    setReviewedCase(null);
    setActivePage("cases");
  }

  function cancelForm() {
    if (
      draft &&
      initialDraftRef.current !== JSON.stringify(draft) &&
      !window.confirm("Discard your unsaved changes to this case?")
    ) {
      return;
    }
    setActivePage(returnPage);
    setDraft(null);
    initialDraftRef.current = null;
  }

  function goToOverview() {
    if (
      activePage === "form" &&
      draft &&
      initialDraftRef.current !== JSON.stringify(draft) &&
      !window.confirm("Discard your unsaved changes to this case and return to Overview?")
    ) {
      return;
    }
    setDraft(null);
    initialDraftRef.current = null;
    setActivePage("overview");
  }

  async function handleSave(draftToSave: CaseDraft): Promise<boolean> {
    try {
      await saveCase(draftToSave);
      await refreshEntries();
      setActivePage("cases");
      setDraft(null);
      initialDraftRef.current = null;
      setCaseSaveStatus("Case saved successfully.");
      return true;
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "The case could not be saved to this device.",
      );
      return false;
    }
  }

  async function handleDelete(entry: LogbookCase) {
    if (!window.confirm("Delete this logbook entry from this device?")) return;
    try {
      await deleteCase(entry.id);
      await refreshEntries();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "The case could not be deleted from this device.",
      );
    }
  }

  return {
    activePage,
    setActivePage,
    draft,
    setDraft,
    caseSaveStatus,
    reviewedCase,
    startNewCase,
    startEditing,
    startReviewing,
    closeReview,
    cancelForm,
    goToOverview,
    handleSave,
    handleDelete,
  };
}
