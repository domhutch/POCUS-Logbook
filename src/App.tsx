import {
  useEffect,
  useMemo,
  useState,
} from "react";
import CaseForm from "./components/CaseForm";
import CaseList from "./components/CaseList";
import CaseReview from "./components/CaseReview";
import MetricsPage from "./components/MetricsPage";
import OverviewPage from "./components/OverviewPage";
import { createSampleCases } from "./domain/metrics";
import {
  createDraft,
  PATHWAYS,
  type CaseDraft,
  type LogbookCase,
  type Pathway,
} from "./domain/logbook";
import {
  deleteCase,
  saveCase,
  savePathwayMode,
} from "./storage/logbook-store";
import { useCaseList } from "./hooks/useCaseList";
import { useCasePrinting } from "./hooks/useCasePrinting";
import { useLogbookBackup } from "./hooks/useLogbookBackup";
import { useLogbookData } from "./hooks/useLogbookData";
import { usePathwayMenu } from "./hooks/usePathwayMenu";
import "./styles.css";

type Page = "overview" | "cases" | "metrics" | "form" | "review";

function App() {
  const [activePathway, setActivePathway] = useState<Pathway>("heart");
  const {
    entries,
    trainingModes,
    setTrainingModes,
    isReady,
    error,
    setError,
    refreshEntries,
  } = useLogbookData();
  const [activePage, setActivePage] = useState<Page>("overview");
  const [returnPage, setReturnPage] = useState<Exclude<Page, "form">>("overview");
  const [draft, setDraft] = useState<CaseDraft | null>(null);
  const [reviewedCase, setReviewedCase] = useState<LogbookCase | null>(null);
  const [isPreviewingSampleMetrics, setIsPreviewingSampleMetrics] =
    useState(false);
  const pathwayMenuRef = usePathwayMenu();
  const {
    pathwayEntries,
    filteredEntries,
    search,
    setSearch,
    caseFilter,
    setCaseFilter,
    resetFilters,
  } = useCaseList(entries, activePathway);
  const backup = useLogbookBackup({ trainingModes, refreshEntries, setError });
  const printing = useCasePrinting(setError);

  const pathway = PATHWAYS[activePathway];
  const pathwayLogbookName = `${pathway.label.replace(/^FUSIC\s+/, "")} Logbook`;
  const sampleMetricCases = useMemo(
    () => createSampleCases(activePathway),
    [activePathway],
  );
  const supervisedCount = pathwayEntries.filter(
    (entry) => entry.supervised,
  ).length;
  const abnormalCount = pathwayEntries.filter(
    (entry) => entry.impressionCategory === "abnormal",
  ).length;
  const changedManagementCount = pathwayEntries.filter(
    (entry) => entry.managementImpact === "changed",
  ).length;
  useEffect(() => {
    document.title = pathwayLogbookName;
  }, [pathwayLogbookName]);

  function startNewCase() {
    setReturnPage(activePage === "cases" ? "cases" : "overview");
    setDraft(createDraft(activePathway));
    setActivePage("form");
  }

  function startEditing(entry: LogbookCase) {
    setReturnPage("cases");
    setDraft({ ...entry });
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
    setActivePage(returnPage);
    setDraft(null);
  }

  function goToOverview() {
    if (
      activePage === "form" &&
      !window.confirm("Discard this case without saving and return to Overview?")
    ) {
      return;
    }
    setDraft(null);
    setActivePage("overview");
  }

  async function handleSave(draftToSave: CaseDraft): Promise<boolean> {
    try {
      await saveCase(draftToSave);
      await refreshEntries();
      setActivePage("cases");
      setDraft(null);
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

  async function handleTrainingModeChange(enabled: boolean) {
    try {
      await savePathwayMode(activePathway, enabled);
      setTrainingModes((current) => ({
        ...current,
        [activePathway]: enabled,
      }));
      setError(null);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "The pathway view preference could not be saved.",
      );
    }
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <button
          className="brand"
          type="button"
          onClick={goToOverview}
          aria-label={`Go to ${pathwayLogbookName} overview`}
        >
          <span className="brand-mark" aria-hidden="true">
            {pathway.icon}
          </span>
          <span className="brand-name">POCUS Logbook</span>
          <span className="brand-pathway">
            {pathway.label.replace(/^FUSIC\s+/, "")}
          </span>
        </button>
        {activePage === "form" ? (
          <button
            className="button button-secondary topbar-action"
            onClick={cancelForm}
          >
            Cancel
          </button>
        ) : activePage === "review" ? (
          <button
            className="button button-secondary topbar-action"
            onClick={closeReview}
          >
            Back to cases
          </button>
        ) : (
          <button
            className="button button-primary topbar-action topbar-action-new-case"
            onClick={startNewCase}
            disabled={!isReady}
          >
            <span aria-hidden="true">+</span> New case
          </button>
        )}
      </header>

      <section
        className="page-content"
        aria-labelledby={
          activePage === "form"
            ? "form-title"
            : activePage === "review"
              ? "review-title"
              : "page-title"
        }
      >
        {activePage !== "form" && activePage !== "review" && (
          <>
            <h1 className="sr-only" id="page-title">
              {activePage === "overview"
                ? "Overview"
                : activePage === "cases"
                  ? "Your cases"
                  : "Metrics"}
            </h1>
            <nav className="page-navigation" aria-label="Main navigation">
              <button
                className={`page-navigation-link ${activePage === "overview" ? "is-active" : ""}`}
                onClick={() => setActivePage("overview")}
                aria-current={activePage === "overview" ? "page" : undefined}
              >
                Overview
              </button>
              <button
                className={`page-navigation-link ${activePage === "cases" ? "is-active" : ""}`}
                onClick={() => setActivePage("cases")}
                aria-current={activePage === "cases" ? "page" : undefined}
              >
                Cases <span>{pathwayEntries.length}</span>
              </button>
              <button
                className={`page-navigation-link ${activePage === "metrics" ? "is-active" : ""}`}
                onClick={() => setActivePage("metrics")}
                aria-current={activePage === "metrics" ? "page" : undefined}
              >
                Metrics
              </button>
            </nav>
          </>
        )}

        {activePage !== "form" && activePage !== "review" && (
          <div className="pathway-picker">
            <span className="pathway-picker-label">Logbook type</span>
            <details className="pathway-menu" ref={pathwayMenuRef}>
              <summary aria-label={`Choose logbook type. Current: ${pathway.label}`}>
                <span>{pathway.label}</span>
                <span className="pathway-menu-count">
                  {pathwayEntries.length}{" "}
                  {pathwayEntries.length === 1 ? "case" : "cases"}
                </span>
                <span className="pathway-menu-chevron" aria-hidden="true" />
              </summary>
              <div className="pathway-menu-options">
                {(Object.keys(PATHWAYS) as Pathway[]).map((key) => {
                  const caseCount = entries.filter(
                    (entry) => entry.pathway === key,
                  ).length;
                  return (
                    <button
                      className="pathway-menu-option"
                      type="button"
                      key={key}
                      onClick={(event) => {
                        setActivePathway(key);
                        resetFilters();
                        event.currentTarget.closest("details")?.removeAttribute("open");
                      }}
                      aria-pressed={activePathway === key}
                    >
                      <span>{PATHWAYS[key].label}</span>
                      <span className="pathway-menu-option-count">
                        {caseCount} {caseCount === 1 ? "case" : "cases"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </details>
          </div>
        )}

        {error && (
          <div className="error-banner" role="alert">
            <div>
              <strong>We couldn’t complete that action.</strong>
              <span>{error}</span>
            </div>
            {!isReady && (
              <button
                className="button button-secondary"
                onClick={() => void refreshEntries().catch((cause: unknown) => {
                  setError(cause instanceof Error ? cause.message : "The on-device logbook could not be opened.");
                })}
              >
                Try again
              </button>
            )}
          </div>
        )}

        {!isReady && !error && (
          <p className="loading-message" role="status">
            Opening your on-device logbook…
          </p>
        )}

        {isReady && activePage === "overview" && (
          <OverviewPage
            pathway={activePathway}
            caseCount={pathwayEntries.length}
            supervisedCount={supervisedCount}
            abnormalCount={abnormalCount}
            changedManagementCount={changedManagementCount}
            trainingMode={trainingModes[activePathway]}
            isReady={isReady}
            isHandlingBackup={backup.isBusy}
            backupStatus={backup.status}
            onTrainingModeChange={(enabled) => void handleTrainingModeChange(enabled)}
            onShowCases={() => setActivePage("cases")}
            onExportBackup={() => void backup.exportBackup()}
            onRestoreBackup={(event) => void backup.restoreBackupFromFile(event)}
          />
        )}

        {isReady && activePage === "form" && draft && (
          <CaseForm
            draft={draft}
            onChange={setDraft}
            onSave={handleSave}
            onCancel={cancelForm}
          />
        )}

        {isReady && activePage === "review" && reviewedCase && (
          <CaseReview
            entry={reviewedCase}
            onEdit={() => startEditing(reviewedCase)}
            onClose={closeReview}
          />
        )}

        {isReady && activePage === "metrics" && (
          <MetricsPage
            cases={
              isPreviewingSampleMetrics ? sampleMetricCases : pathwayEntries
            }
            pathway={activePathway}
            isSampleData={isPreviewingSampleMetrics}
            canPreviewSamples={import.meta.env.DEV}
            onToggleSampleData={() =>
              setIsPreviewingSampleMetrics((current) => !current)
            }
          />
        )}

        {isReady && activePage === "cases" && (
          <CaseList
            entries={filteredEntries}
            pathwayEntries={pathwayEntries}
            pathway={activePathway}
            search={search}
            caseFilter={caseFilter}
            onSearchChange={setSearch}
            onFilterChange={setCaseFilter}
            onAddFirstCase={startNewCase}
            onReview={startReviewing}
            onPrint={printing.printCase}
            onEdit={startEditing}
            onDelete={(entry) => void handleDelete(entry)}
          />
        )}
      </section>

      {printing.document && (
        <section
          className="print-preview-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="print-preview-title"
        >
          <header className="print-preview-toolbar">
            <h2 id="print-preview-title">Case print preview</h2>
            <div>
              <button
                className="button button-secondary"
                type="button"
                onClick={printing.closePreview}
              >
                Back to cases
              </button>
              <button
                className="button button-primary"
                type="button"
                onClick={printing.printPreview}
                disabled={!printing.isFrameReady}
              >
                Print / save PDF
              </button>
            </div>
          </header>
          <iframe
            ref={printing.frameRef}
            className="print-preview-frame"
            title="Printable case sheet"
            srcDoc={printing.document}
            onLoad={printing.markFrameReady}
          />
        </section>
      )}

      <footer className="app-footer">
        <span>Private by default · Stored on this device</span>
        <span>Not for clinical decision-making or patient care</span>
      </footer>
    </main>
  );
}

export default App;
