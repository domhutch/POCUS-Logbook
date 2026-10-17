import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import CaseForm from "./components/CaseForm";
import CaseList from "./components/CaseList";
import CaseReview from "./components/CaseReview";
import MetricsPage from "./components/MetricsPage";
import OverviewPage from "./components/OverviewPage";
import SettingsPage from "./components/SettingsPage";
import WelcomeScreen from "./components/WelcomeScreen";
import { getCaseSequenceNumbers } from "./domain/case-display";
import { createAdminSampleCases, createFullAdminSampleCases } from "./domain/admin-sample-data";
import {
  createSampleCases,
  summarizeCaseMix,
  summarizeTrainingProgress,
} from "./domain/metrics";
import {
  createDraft,
  isSampleCase,
  PATHWAYS,
  type CaseDraft,
  type LogbookCase,
  type Pathway,
} from "./domain/logbook";
import {
  addSampleCases,
  deleteSampleCases,
  deleteCase,
  saveAppSettings,
  saveCase,
  savePathwayMode,
  type AppSettings,
} from "./storage/logbook-store";
import { useCaseList } from "./hooks/useCaseList";
import { useCasePrinting } from "./hooks/useCasePrinting";
import { useLogbookBackup } from "./hooks/useLogbookBackup";
import { useLogbookData } from "./hooks/useLogbookData";
import { usePathwayMenu } from "./hooks/usePathwayMenu";
import "./styles.css";

type Page = "overview" | "cases" | "metrics" | "settings" | "form" | "review";

function App() {
  const [activePathway, setActivePathway] = useState<Pathway>("heart");
  const {
    entries,
    trainingModes,
    setTrainingModes,
    appSettings,
    setAppSettings,
    isReady,
    error,
    setError,
    refreshEntries,
  } = useLogbookData();
  const [activePage, setActivePage] = useState<Page>("overview");
  const [returnPage, setReturnPage] = useState<Exclude<Page, "form">>("overview");
  const [draft, setDraft] = useState<CaseDraft | null>(null);
  const initialDraftRef = useRef<string | null>(null);
  const [caseSaveStatus, setCaseSaveStatus] = useState<string | null>(null);
  const [reviewedCase, setReviewedCase] = useState<LogbookCase | null>(null);
  const [isPreviewingSampleMetrics, setIsPreviewingSampleMetrics] =
    useState(false);
  const [isHandlingTestData, setIsHandlingTestData] = useState(false);
  const [testDataStatus, setTestDataStatus] = useState<string | null>(null);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [settingsStatus, setSettingsStatus] = useState<string | null>(null);
  const [isPreviewingWelcome, setIsPreviewingWelcome] = useState(false);
  const pathwayMenuRef = usePathwayMenu();
  const caseNumbers = useMemo(() => getCaseSequenceNumbers(entries), [entries]);
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
  const enabledPathways = useMemo(
    () => (Object.keys(PATHWAYS) as Pathway[]).filter((module) => appSettings.enabledModules[module]),
    [appSettings.enabledModules],
  );
  const pathwayLogbookName = `${pathway.label} Logbook`;
  const sampleMetricCases = useMemo(
    () => createSampleCases(activePathway),
    [activePathway],
  );
  const trainingProgress = summarizeTrainingProgress(entries, activePathway);
  const caseMix = summarizeCaseMix(entries, activePathway);
  const sampleCaseCount = entries.filter(isSampleCase).length;
  const canManageTestData =
    import.meta.env.DEV ||
    new URLSearchParams(window.location.search).get("admin") === "1";
  const abnormalCount = pathwayEntries.filter(
    (entry) => entry.impressionCategory === "abnormal",
  ).length;
  const changedManagementCount = pathwayEntries.filter(
    (entry) => entry.managementImpact === "changed",
  ).length;
  useEffect(() => {
    document.title = appSettings.onboardingComplete
      ? `${pathwayLogbookName} · CritSono: POCUS Logbook`
      : "Welcome · CritSono: POCUS Logbook";
  }, [appSettings.onboardingComplete, pathwayLogbookName]);

  useEffect(() => {
    if (!isReady) return;
    document.documentElement.dataset.textSize = appSettings.textSize;
  }, [appSettings.textSize, isReady]);

  useEffect(() => {
    if (enabledPathways.includes(activePathway)) return;
    const nextPathway = enabledPathways[0];
    if (nextPathway) {
      setActivePathway(nextPathway);
      resetFilters();
    }
  }, [activePathway, enabledPathways, resetFilters]);

  function startNewCase() {
    setCaseSaveStatus(null);
    setReturnPage(activePage === "form" ? "overview" : activePage);
    const newDraft = createDraft(activePathway);
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

  async function handlePopulateTestCases(pathwayToPopulate: Pathway) {
    setIsHandlingTestData(true);
    setTestDataStatus(null);
    try {
      const addedCount = await addSampleCases(createAdminSampleCases(pathwayToPopulate));
      await refreshEntries();
      const pathwayName = PATHWAYS[pathwayToPopulate].label;
      setTestDataStatus(
        addedCount > 0
          ? `Added ${addedCount} ${pathwayName} sample cases to this device.`
          : `${pathwayName} sample cases are already on this device.`,
      );
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Sample cases could not be added to this device.",
      );
    } finally {
      setIsHandlingTestData(false);
    }
  }

  async function handleExportFullTestData() {
    setIsHandlingTestData(true);
    setTestDataStatus(null);
    setError(null);
    try {
      const cases = createFullAdminSampleCases();
      const delivery = await backup.exportAdminSampleBackup(cases);
      setTestDataStatus(
        delivery === "shared"
          ? `Prepared a full ${cases.length}-case sample backup to share. Restore / merge it from Settings.`
          : `Downloaded a full ${cases.length}-case sample backup. Restore / merge it from Settings.`,
      );
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The full sample backup could not be exported.");
    } finally {
      setIsHandlingTestData(false);
    }
  }

  async function handleClearTestCases() {
    if (sampleCaseCount === 0) return;
    if (
      !window.confirm(
        `Remove ${sampleCaseCount} clearly marked sample cases from this device? Real cases will not be changed.`,
      )
    ) {
      return;
    }
    setIsHandlingTestData(true);
    setTestDataStatus(null);
    try {
      const removedCount = await deleteSampleCases();
      await refreshEntries();
      setTestDataStatus(`Removed ${removedCount} sample cases.`);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Sample cases could not be removed from this device.",
      );
    } finally {
      setIsHandlingTestData(false);
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

  async function handleSettingsSave(nextSettings: AppSettings) {
    setIsSavingSettings(true);
    setSettingsStatus(null);
    try {
      await saveAppSettings(nextSettings);
      setAppSettings(nextSettings);
      setSettingsStatus("Settings saved on this device.");
      setError(null);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Settings could not be saved on this device.",
      );
    } finally {
      setIsSavingSettings(false);
    }
  }

  async function handleOnboardingComplete(nextSettings: AppSettings) {
    setIsSavingSettings(true);
    setError(null);
    try {
      await saveAppSettings(nextSettings);
      setAppSettings(nextSettings);
      const firstEnabledPathway = (Object.keys(PATHWAYS) as Pathway[]).find(
        (module) => nextSettings.enabledModules[module],
      );
      if (firstEnabledPathway) setActivePathway(firstEnabledPathway);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Your setup could not be saved on this device.",
      );
    } finally {
      setIsSavingSettings(false);
    }
  }

  if (isReady && (isPreviewingWelcome || !appSettings.onboardingComplete)) {
    return (
      <WelcomeScreen
        settings={appSettings}
        isSaving={isSavingSettings}
        error={error}
        onComplete={(nextSettings) => void handleOnboardingComplete(nextSettings)}
        isPreview={isPreviewingWelcome}
        onExitPreview={() => {
          document.documentElement.dataset.textSize = appSettings.textSize;
          setIsPreviewingWelcome(false);
        }}
      />
    );
  }

  return (
    <>
    {activePage === "settings" && (
      <div className="settings-easter-egg" aria-hidden="true">
        <img src={`${import.meta.env.BASE_URL}images/settings-overscroll-portrait.png`} alt="" draggable={false} />
      </div>
    )}
    <main className="app-shell">
      <header className="topbar">
        <button
          className="brand"
          type="button"
          onClick={goToOverview}
          aria-label={`Go to CritSono ${pathway.label} overview`}
        >
          <span className="brand-mark" aria-hidden="true">
            {pathway.icon}
          </span>
          <span className="brand-copy">
            <span className="brand-name">CritSono</span>
            <span className="brand-pathway">
              {pathway.label}
            </span>
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
                  : activePage === "metrics"
                    ? "Metrics"
                    : "Settings"}
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
              <button
                className={`page-navigation-link ${activePage === "settings" ? "is-active" : ""}`}
                onClick={() => setActivePage("settings")}
                aria-current={activePage === "settings" ? "page" : undefined}
              >
                Settings
              </button>
            </nav>
          </>
        )}

        {activePage !== "form" && activePage !== "review" && activePage !== "settings" && (
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
                {enabledPathways.map((key) => {
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
            {isReady && (
              <button
                className="button button-secondary"
                type="button"
                onClick={() => setError(null)}
              >
                Dismiss
              </button>
            )}
          </div>
        )}

        {caseSaveStatus && activePage === "cases" && (
          <p className="success-banner" role="status">{caseSaveStatus}</p>
        )}

        {!isReady && !error && (
          <p className="loading-message" role="status">
            Opening your on-device logbook…
          </p>
        )}

        {isReady && activePage === "overview" && (
          <OverviewPage
            pathway={activePathway}
            enabledPathways={enabledPathways}
            progress={trainingProgress}
            caseMix={caseMix}
            canManageTestData={canManageTestData}
            sampleCaseCount={sampleCaseCount}
            isHandlingTestData={isHandlingTestData}
            testDataStatus={testDataStatus}
            abnormalCount={abnormalCount}
            changedManagementCount={changedManagementCount}
            trainingMode={trainingModes[activePathway]}
            isReady={isReady}
            onTrainingModeChange={(enabled) => void handleTrainingModeChange(enabled)}
            onShowCases={() => setActivePage("cases")}
            onPopulateTestCases={(pathwayToPopulate) =>
              void handlePopulateTestCases(pathwayToPopulate)
            }
            onExportFullTestData={() => void handleExportFullTestData()}
            onClearTestCases={() => void handleClearTestCases()}
            onPreviewWelcome={() => setIsPreviewingWelcome(true)}
          />
        )}

        {isReady && activePage === "form" && draft && (
          <CaseForm
            draft={draft}
            onChange={setDraft}
            onSave={handleSave}
            onCancel={cancelForm}
            supervisors={appSettings.supervisors}
          />
        )}

        {isReady && activePage === "settings" && (
          <SettingsPage
            settings={appSettings}
            isSaving={isSavingSettings}
            status={settingsStatus}
            cases={pathwayEntries}
            isHandlingBackup={backup.isBusy}
            backupStatus={backup.status}
            onSave={(nextSettings) => void handleSettingsSave(nextSettings)}
            onPrintLogbook={() => printing.printLogbook(pathwayEntries, activePathway)}
            onDownloadCaseReports={() => printing.printCaseReports(pathwayEntries, activePathway)}
            onExportCsv={() => void backup.exportCsv(pathwayEntries, activePathway)}
            onExportBackup={(passphrase) => backup.exportBackup(passphrase)}
            onRestoreBackup={(event, passphrase) => backup.restoreBackupFromFile(event, passphrase)}
            onUploadBackupToGoogleDrive={(passphrase, clientId) => backup.uploadBackupToGoogleDrive(passphrase, clientId)}
            onRestoreBackupFromGoogleDrive={(passphrase, clientId) => backup.restoreBackupFromGoogleDrive(passphrase, clientId)}
          />
        )}

        {isReady && activePage === "review" && reviewedCase && (
          <CaseReview
            entry={reviewedCase}
            caseNumber={caseNumbers.get(reviewedCase.id) ?? 1}
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
            onAddCase={startNewCase}
          />
        )}

        {isReady && activePage === "cases" && (
          <CaseList
            entries={filteredEntries}
            pathwayEntries={pathwayEntries}
            caseNumbers={caseNumbers}
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
            <h2 id="print-preview-title">PDF preview</h2>
            <div>
              <button
                className="button button-secondary"
                type="button"
                onClick={printing.closePreview}
              >
                Close and return to logbook
              </button>
              <button
                className="button button-secondary"
                type="button"
                onClick={() => void printing.downloadPdf()}
                disabled={!printing.isFrameReady || printing.isDownloading}
              >
                {printing.isDownloading ? "Preparing PDF…" : "Download PDF"}
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
          {printing.downloadStatus && (
            <p className="pdf-download-status" role="status">{printing.downloadStatus}</p>
          )}
          {printing.downloadError && (
            <p className="pdf-download-error" role="alert">{printing.downloadError}</p>
          )}
          <iframe
            ref={printing.frameRef}
            className="print-preview-frame"
            title="CritSono: POCUS Logbook PDF preview"
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
    </>
  );
}

export default App;
