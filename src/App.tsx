import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
} from "react";
import CaseForm from "./components/CaseForm";
import CaseList from "./components/CaseList";
import CaseReview from "./components/CaseReview";
import MetricsPage from "./components/MetricsPage";
import OverviewPage from "./components/OverviewPage";
import { createBackup, parseBackup } from "./domain/backup";
import { createCasePrintDocument } from "./domain/case-print";
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
  getCases,
  getPathwayModes,
  restoreBackup,
  saveCase,
  savePathwayMode,
} from "./storage/logbook-store";
import "./styles.css";

type CaseFilter = "all" | "supervised" | "unsupervised";
type Page = "overview" | "cases" | "metrics" | "form" | "review";
const MAX_BACKUP_SIZE = 10 * 1024 * 1024;

function App() {
  const [activePathway, setActivePathway] = useState<Pathway>("heart");
  const [entries, setEntries] = useState<LogbookCase[]>([]);
  const [trainingModes, setTrainingModes] = useState<Record<Pathway, boolean>>({
    lung: true,
    heart: true,
  });
  const [isReady, setIsReady] = useState(false);
  const [activePage, setActivePage] = useState<Page>("overview");
  const [returnPage, setReturnPage] = useState<Exclude<Page, "form">>("overview");
  const [draft, setDraft] = useState<CaseDraft | null>(null);
  const [reviewedCase, setReviewedCase] = useState<LogbookCase | null>(null);
  const [search, setSearch] = useState("");
  const [caseFilter, setCaseFilter] = useState<CaseFilter>("all");
  const [error, setError] = useState<string | null>(null);
  const [backupStatus, setBackupStatus] = useState<string | null>(null);
  const [isHandlingBackup, setIsHandlingBackup] = useState(false);
  const [isPreviewingSampleMetrics, setIsPreviewingSampleMetrics] =
    useState(false);
  const [printDocument, setPrintDocument] = useState<string | null>(null);
  const [isPrintFrameReady, setIsPrintFrameReady] = useState(false);
  const printFrameRef = useRef<HTMLIFrameElement>(null);
  const pathwayMenuRef = useRef<HTMLDetailsElement>(null);

  async function refreshEntries() {
    const [storedEntries, storedModes] = await Promise.all([
      getCases(),
      getPathwayModes(),
    ]);
    setEntries(storedEntries);
    setTrainingModes((current) => ({ ...current, ...storedModes }));
    setIsReady(true);
    setError(null);
  }

  useEffect(() => {
    const handleBlockedUpgrade = () => {
      setError(
        "Close other POCUS Logbook tabs or app windows, then retry the database upgrade.",
      );
    };
    window.addEventListener(
      "pocus-logbook-upgrade-blocked",
      handleBlockedUpgrade,
    );
    void refreshEntries().catch((cause: unknown) => {
      setError(
        cause instanceof Error
          ? cause.message
          : "The on-device logbook could not be opened.",
      );
    });
    return () => {
      window.removeEventListener(
          "pocus-logbook-upgrade-blocked",
          handleBlockedUpgrade,
      );
    };
  }, []);

  useEffect(() => {
    function closePathwayMenu(event: PointerEvent) {
      const menu = pathwayMenuRef.current;
      if (menu?.open && event.target instanceof Node && !menu.contains(event.target)) {
        menu.open = false;
      }
    }

    function handlePathwayMenuKeydown(event: KeyboardEvent) {
      const menu = pathwayMenuRef.current;
      if (event.key === "Escape" && menu?.open) {
        menu.open = false;
        menu.querySelector("summary")?.focus();
      }
    }

    document.addEventListener("pointerdown", closePathwayMenu);
    document.addEventListener("keydown", handlePathwayMenuKeydown);
    return () => {
      document.removeEventListener("pointerdown", closePathwayMenu);
      document.removeEventListener("keydown", handlePathwayMenuKeydown);
    };
  }, []);

  const pathway = PATHWAYS[activePathway];
  const pathwayLogbookName = `${pathway.label.replace(/^FUSIC\s+/, "")} Logbook`;
  const pathwayEntries = useMemo(
    () => entries.filter((entry) => entry.pathway === activePathway),
    [activePathway, entries],
  );
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
  const filteredEntries = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return pathwayEntries
      .filter((entry) => {
        if (caseFilter === "supervised" && !entry.supervised) return false;
        if (caseFilter === "unsupervised" && entry.supervised) return false;
        if (!query) return true;
        const clinicalDetails =
          entry.pathway === "lung"
            ? [
                ...entry.regions,
                entry.ventilatorySupport,
                ...Object.values(entry.findings).flatMap((findings) =>
                  Object.entries(findings).flat(),
                ),
              ]
            : [
                ...entry.views,
                entry.ventilatorySupport,
                entry.cardiovascularSupport,
                ...Object.entries(entry.findings).flatMap(([finding, result]) => [
                  finding,
                  result,
                ]),
              ];
        return [
          entry.date,
          entry.caseType === "healthy_volunteer"
            ? "healthy volunteer"
            : "clinical",
          entry.diagnosis,
          entry.indication,
          entry.summary,
          entry.reflection,
          entry.supervisorName,
          ...clinicalDetails,
        ].some((value) => value.toLocaleLowerCase().includes(query));
      })
      .sort(
        (first, second) =>
          second.date.localeCompare(first.date) ||
          second.updatedAt.localeCompare(first.updatedAt),
      );
  }, [caseFilter, pathwayEntries, search]);

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

  function handlePrintCase(entry: LogbookCase) {
    setError(null);
    const document = createCasePrintDocument(entry);
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      setPrintDocument(document);
      setIsPrintFrameReady(false);
      return;
    }

    try {
      printWindow.document.open();
      printWindow.document.write(document);
      printWindow.document.close();
      window.setTimeout(() => {
        printWindow.focus();
        printWindow.print();
      }, 250);
    } catch (cause) {
      printWindow.close();
      setError(
        cause instanceof Error
          ? cause.message
          : "The printable case sheet could not be opened.",
      );
    }
  }

  function closePrintPreview() {
    setPrintDocument(null);
    setIsPrintFrameReady(false);
  }

  function printFallbackDocument() {
    const printWindow = printFrameRef.current?.contentWindow;
    if (!printWindow) {
      setError("The print preview is not ready yet. Wait a moment and try again.");
      return;
    }
    try {
      printWindow.focus();
      printWindow.print();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "The case print dialog could not be opened.",
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

  async function handleBackupExport() {
    setIsHandlingBackup(true);
    setError(null);
    setBackupStatus(null);
    try {
      const [storedCases, storedModes] = await Promise.all([
        getCases(),
        getPathwayModes(),
      ]);
      const backup = createBackup(storedCases, {
        lung: storedModes.lung ?? trainingModes.lung,
        heart: storedModes.heart ?? trainingModes.heart,
      });
      const file = new Blob([JSON.stringify(backup, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(file);
      const link = document.createElement("a");
      link.href = url;
      link.download = `pocus-logbook-backup-${backup.exportedAt.replace(/[:.]/g, "-")}.json`;
      document.body.append(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      setBackupStatus(
        `Backup downloaded with ${storedCases.length} ${
          storedCases.length === 1 ? "case" : "cases"
        }. Save the file somewhere private.`,
      );
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "A backup could not be created or downloaded.",
      );
    } finally {
      setIsHandlingBackup(false);
    }
  }

  async function handleBackupRestore(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    if (!file) return;

    setIsHandlingBackup(true);
    setError(null);
    setBackupStatus(null);
    try {
      if (file.size > MAX_BACKUP_SIZE) {
        throw new Error("Backup files must be 10 MB or smaller.");
      }
      const backup = parseBackup(await file.text());
      const result = await restoreBackup(backup);
      await refreshEntries();
      setBackupStatus(
        `Restore complete: ${result.addedCases} ${
          result.addedCases === 1 ? "case" : "cases"
        } added, ${result.skippedCases} existing ${
          result.skippedCases === 1 ? "case" : "cases"
        } kept. Current cases and preferences were not replaced.`,
      );
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "The backup could not be read or restored.",
      );
    } finally {
      setIsHandlingBackup(false);
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
          <span>{pathwayLogbookName}</span>
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
                        setSearch("");
                        setCaseFilter("all");
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
                  setError(
                    cause instanceof Error
                      ? cause.message
                      : "The on-device logbook could not be opened.",
                  );
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
            isHandlingBackup={isHandlingBackup}
            backupStatus={backupStatus}
            onTrainingModeChange={(enabled) => void handleTrainingModeChange(enabled)}
            onShowCases={() => setActivePage("cases")}
            onExportBackup={() => void handleBackupExport()}
            onRestoreBackup={(event) => void handleBackupRestore(event)}
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
            onPrint={handlePrintCase}
            onEdit={startEditing}
            onDelete={(entry) => void handleDelete(entry)}
          />
        )}
      </section>

      {(activePage === "overview" || activePage === "cases") && (
        <button
          className="button button-primary topbar-action floating-new-case"
          type="button"
          onClick={startNewCase}
          disabled={!isReady}
        >
          <span aria-hidden="true">+</span> New case
        </button>
      )}

      {printDocument && (
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
                onClick={closePrintPreview}
              >
                Back to cases
              </button>
              <button
                className="button button-primary"
                type="button"
                onClick={printFallbackDocument}
                disabled={!isPrintFrameReady}
              >
                Print / save PDF
              </button>
            </div>
          </header>
          <iframe
            ref={printFrameRef}
            className="print-preview-frame"
            title="Printable case sheet"
            srcDoc={printDocument}
            onLoad={() => setIsPrintFrameReady(true)}
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
