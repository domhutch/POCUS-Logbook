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
import SettingsPage from "./components/SettingsPage";
import WelcomeScreen from "./components/WelcomeScreen";
import { getCaseSequenceNumbers } from "./domain/case-display";
import {
  createSampleCases,
  summarizeCaseMix,
  summarizeTrainingProgress,
} from "./domain/metrics";
import {
  PATHWAYS,
  type LogbookCase,
  type Pathway,
} from "./domain/logbook";
import { useCaseList } from "./hooks/useCaseList";
import { useCasePrinting } from "./hooks/useCasePrinting";
import { useLogbookBackup } from "./hooks/useLogbookBackup";
import { useLogbookData } from "./hooks/useLogbookData";
import { usePathwayMenu } from "./hooks/usePathwayMenu";
import { useCaseWorkflow } from "./hooks/useCaseWorkflow";
import { useSampleDataManagement } from "./hooks/useSampleDataManagement";
import { useSettingsWorkflow } from "./hooks/useSettingsWorkflow";

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
  const {
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
  } = useCaseWorkflow({ activePathway, appSettings, refreshEntries, setError });
  const [isPreviewingSampleMetrics, setIsPreviewingSampleMetrics] =
    useState(false);
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
  const settingsWorkflow = useSettingsWorkflow({
    activePathway,
    setActivePathway,
    setAppSettings,
    setTrainingModes,
    setError,
  });
  const {
    sampleCaseCount,
    isHandlingTestData,
    testDataStatus,
    populateCases,
    exportFullDataset,
    clearCases,
  } = useSampleDataManagement({
    entries,
    refreshEntries,
    exportFullBackup: backup.exportAdminSampleBackup,
    setError,
  });

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

  function printCase(entry: LogbookCase) {
    printing.printCase(entry, appSettings.operatorName);
  }

  function printHeartIcsForm(entry: Extract<LogbookCase, { pathway: "heart" }>) {
    printing.printHeartIcsForm({
      ...entry,
      operatorName: appSettings.operatorName.trim() || entry.operatorName,
    });
  }

  function printLungIcsForm(entry: Extract<LogbookCase, { pathway: "lung" }>) {
    printing.printLungIcsForm(entry, appSettings.operatorName);
  }

  function printAbdomenIcsForm(entry: Extract<LogbookCase, { pathway: "abdomen" }>) {
    printing.printAbdomenIcsForm(entry, appSettings.operatorName);
  }

  if (isReady && (isPreviewingWelcome || !appSettings.onboardingComplete)) {
    return (
      <WelcomeScreen
        settings={appSettings}
        isSaving={settingsWorkflow.isSaving}
        error={error}
        onComplete={(nextSettings) => void settingsWorkflow.completeOnboarding(nextSettings)}
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
            onTrainingModeChange={(enabled) => void settingsWorkflow.changeTrainingMode(enabled)}
            onShowCases={() => setActivePage("cases")}
            onPopulateTestCases={(pathwayToPopulate) => void populateCases(pathwayToPopulate)}
            onExportFullTestData={() => void exportFullDataset()}
            onClearTestCases={() => void clearCases()}
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
            isSaving={settingsWorkflow.isSaving}
            status={settingsWorkflow.status}
            cases={pathwayEntries}
            allCases={entries}
            heartCases={entries.filter((entry): entry is Extract<LogbookCase, { pathway: "heart" }> => entry.pathway === "heart")}
            lungCases={entries.filter((entry): entry is Extract<LogbookCase, { pathway: "lung" }> => entry.pathway === "lung")}
            abdomenCases={entries.filter((entry): entry is Extract<LogbookCase, { pathway: "abdomen" }> => entry.pathway === "abdomen")}
            isHandlingBackup={backup.isBusy}
            backupStatus={backup.status}
            onSave={(nextSettings) => void settingsWorkflow.saveSettings(nextSettings)}
            onPrintLogbook={() => printing.printLogbook(pathwayEntries, activePathway, appSettings.operatorName)}
            onDownloadCaseReports={() => printing.printCaseReports(pathwayEntries, activePathway, appSettings.operatorName)}
            onDownloadFullLogbook={() => printing.printFullLogbook(entries, appSettings.operatorName)}
            onDownloadHeartIcsForms={() => printing.printHeartIcsForms(
              entries.filter((entry): entry is Extract<LogbookCase, { pathway: "heart" }> => entry.pathway === "heart"),
              appSettings.operatorName,
            )}
            onDownloadLungIcsForms={() => printing.printLungIcsForms(
              entries.filter((entry): entry is Extract<LogbookCase, { pathway: "lung" }> => entry.pathway === "lung"),
              appSettings.operatorName,
            )}
            onDownloadAbdomenIcsForms={() => printing.printAbdomenIcsForms(
              entries.filter((entry): entry is Extract<LogbookCase, { pathway: "abdomen" }> => entry.pathway === "abdomen"),
              appSettings.operatorName,
            )}
            onExportCsv={() => void backup.exportCsv(pathwayEntries, activePathway)}
            onExportBackup={(passphrase) => backup.exportBackup(passphrase)}
            onRestoreBackup={(event, passphrase) => backup.restoreBackupFromFile(event, passphrase)}
          />
        )}

        {isReady && activePage === "review" && reviewedCase && (
          <CaseReview
            entry={reviewedCase}
            caseNumber={caseNumbers.get(reviewedCase.id) ?? 1}
            onPrint={() => printCase(reviewedCase)}
            onPrintHeartIcsForm={() => reviewedCase.pathway === "heart" && printHeartIcsForm(reviewedCase)}
            onPrintLungIcsForm={() => reviewedCase.pathway === "lung" && printLungIcsForm(reviewedCase)}
            onPrintAbdomenIcsForm={() => reviewedCase.pathway === "abdomen" && printAbdomenIcsForm(reviewedCase)}
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
            onPrint={printCase}
            onPrintHeartIcsForm={printHeartIcsForm}
            onPrintLungIcsForm={printLungIcsForm}
            onPrintAbdomenIcsForm={printAbdomenIcsForm}
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
