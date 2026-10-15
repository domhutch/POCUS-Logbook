import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
} from "react";
import CaseForm from "./components/CaseForm";
import { createBackup, parseBackup } from "./domain/backup";
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
type Page = "overview" | "cases" | "form";
const MAX_BACKUP_SIZE = 10 * 1024 * 1024;

function caseSummary(entry: LogbookCase) {
  const scanDetails =
    entry.pathway === "lung"
      ? `${entry.regions.length} of 6 regions recorded`
      : `${entry.views.length} views recorded`;

  return [entry.indication, scanDetails].filter(Boolean).join(" · ");
}

function formatDate(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function App() {
  const [activePathway, setActivePathway] = useState<Pathway>("lung");
  const [entries, setEntries] = useState<LogbookCase[]>([]);
  const [trainingModes, setTrainingModes] = useState<Record<Pathway, boolean>>({
    lung: true,
    heart: true,
  });
  const [isReady, setIsReady] = useState(false);
  const [activePage, setActivePage] = useState<Page>("overview");
  const [returnPage, setReturnPage] = useState<Exclude<Page, "form">>("overview");
  const [draft, setDraft] = useState<CaseDraft | null>(null);
  const [search, setSearch] = useState("");
  const [caseFilter, setCaseFilter] = useState<CaseFilter>("all");
  const [error, setError] = useState<string | null>(null);
  const [backupStatus, setBackupStatus] = useState<string | null>(null);
  const [isHandlingBackup, setIsHandlingBackup] = useState(false);
  const backupInputRef = useRef<HTMLInputElement>(null);

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

  const pathway = PATHWAYS[activePathway];
  const pathwayEntries = useMemo(
    () => entries.filter((entry) => entry.pathway === activePathway),
    [activePathway, entries],
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

  function startNewCase() {
    setReturnPage(activePage === "cases" ? "cases" : "overview");
    setDraft(createDraft(activePathway));
    setActivePage("form");
  }

  function startEditing(entry: LogbookCase) {
    setReturnPage("cases");
    setDraft({ ...entry });
    setActivePage("form");
  }

  function cancelForm() {
    setActivePage(returnPage);
    setDraft(null);
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
        <a className="brand" href="#" aria-label="POCUS Logbook home">
          <span className="brand-mark" aria-hidden="true">
            P
          </span>
          <span>POCUS Logbook</span>
        </a>
        {activePage === "form" ? (
          <button
            className="button button-secondary topbar-action"
            onClick={cancelForm}
          >
            Cancel
          </button>
        ) : (
          <button
            className="button button-primary topbar-action"
            onClick={startNewCase}
            disabled={!isReady}
          >
            <span aria-hidden="true">+</span> New case
          </button>
        )}
      </header>

      <section
        className="page-content"
        aria-labelledby={activePage === "form" ? "form-title" : "page-title"}
      >
        {activePage !== "form" && (
          <>
            <div className="page-heading">
              <div>
                <p className="eyebrow">
                  {activePage === "overview"
                    ? "Your practice, your record"
                    : `${pathway.label} logbook`}
                </p>
                <h1 id="page-title">
                  {activePage === "overview"
                    ? "A logbook that grows with you."
                    : "Your cases"}
                </h1>
                <p className="page-intro">
                  {activePage === "overview"
                    ? "Record scans during training and keep logging after certification. Your entries stay on this device."
                    : "Search, review, and update your de-identified scan records."}
                </p>
              </div>
            </div>
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
            </nav>
          </>
        )}

        {activePage !== "form" && (
          <nav className="pathway-tabs" aria-label="Choose a pathway">
            {(Object.keys(PATHWAYS) as Pathway[]).map((key) => (
              <button
                className={`pathway-tab ${activePathway === key ? "is-active" : ""}`}
                key={key}
                onClick={() => {
                  setActivePathway(key);
                  setSearch("");
                  setCaseFilter("all");
                }}
                aria-pressed={activePathway === key}
              >
                <span>{PATHWAYS[key].label}</span>
                <span className="tab-count">
                  {entries.filter((entry) => entry.pathway === key).length}
                </span>
              </button>
            ))}
          </nav>
        )}

        {activePage !== "form" && (
          <section className="pathway-heading" aria-labelledby="pathway-title">
            <div>
              <p className="eyebrow">Personal logbook</p>
              <h2 id="pathway-title">{pathway.label}</h2>
              <p className="pathway-description">{pathway.description}</p>
            </div>
            <label className="mode-switch">
              <span>
                <strong>Training progress</strong>
                <small>
                  {trainingModes[activePathway]
                    ? "Targets are visible"
                    : "Targets are hidden"}
                </small>
              </span>
              <input
                type="checkbox"
                role="switch"
                checked={trainingModes[activePathway]}
                onChange={(event) =>
                  void handleTrainingModeChange(event.currentTarget.checked)
                }
                aria-label={`Show ${pathway.label} training progress`}
              />
            </label>
          </section>
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
          <>
            <section
              className="stats-grid"
              aria-label={`${pathway.label} ${
                trainingModes[activePathway] ? "training totals" : "review summary"
              }`}
            >
              {trainingModes[activePathway] ? (
                <>
                  <article className="stat-card stat-card-featured">
                    <span className="stat-label">Cases logged</span>
                    <strong className="stat-value">{pathwayEntries.length}</strong>
                    <span className="stat-note">
                      {Math.max(0, pathway.totalTarget - pathwayEntries.length)} to
                      training reference
                    </span>
                  </article>
                  <article className="stat-card">
                    <span className="stat-label">Directly supervised</span>
                    <strong className="stat-value">{supervisedCount}</strong>
                    <span className="stat-note">
                      {pathway.supervisedTarget} direct supervision reference
                    </span>
                  </article>
                  <article className="stat-card">
                    <span className="stat-label">Unsupervised cases</span>
                    <strong className="stat-value stat-value-small">
                      {pathwayEntries.length - supervisedCount}
                    </strong>
                    <span className="stat-note">
                      {pathwayEntries.length - supervisedCount} without direct
                      supervision
                    </span>
                  </article>
                </>
              ) : (
                <>
                  <article className="stat-card stat-card-featured">
                    <span className="stat-label">Cases logged</span>
                    <strong className="stat-value">{pathwayEntries.length}</strong>
                    <span className="stat-note">All recorded scans</span>
                  </article>
                  <article className="stat-card">
                    <span className="stat-label">Abnormal impressions</span>
                    <strong className="stat-value">{abnormalCount}</strong>
                    <span className="stat-note">Marked abnormal for review</span>
                  </article>
                  <article className="stat-card">
                    <span className="stat-label">Management changed</span>
                    <strong className="stat-value">{changedManagementCount}</strong>
                    <span className="stat-note">Marked as changing management</span>
                  </article>
                </>
              )}
            </section>

            {trainingModes[activePathway] && (
              <p className="source-note">
                Training references are drawn from the supplied{" "}
                {pathway.source}. They are a personal aid, not an assessment of
                eligibility or competence.
              </p>
            )}

            <section className="backup-panel" aria-labelledby="backup-title">
              <div className="backup-copy">
                <p className="eyebrow">Recovery</p>
                <h2 id="backup-title">Keep a safe copy</h2>
                <p>
                  Download a portable backup or merge one into this logbook.
                  Existing cases and preferences are kept on conflicts.
                </p>
              </div>
              <div className="backup-actions">
                <button
                  className="button button-secondary"
                  onClick={() => void handleBackupExport()}
                  disabled={isHandlingBackup || !isReady}
                >
                  Download backup
                </button>
                <button
                  className="button button-primary"
                  onClick={() => backupInputRef.current?.click()}
                  disabled={isHandlingBackup || !isReady}
                >
                  Restore backup
                </button>
                <input
                  ref={backupInputRef}
                  className="sr-only"
                  type="file"
                  accept=".json,application/json"
                  aria-label="Choose a POCUS Logbook backup file"
                  onChange={(event) => void handleBackupRestore(event)}
                />
              </div>
              <p className="backup-privacy">
                The JSON backup is readable and not encrypted. Store it
                somewhere private; don’t upload it to a shared server until
                encrypted backup support is available.
              </p>
              {backupStatus && (
                <p className="backup-status" role="status">
                  {backupStatus}
                </p>
              )}
            </section>
          </>
        )}

        {isReady && activePage === "form" && draft && (
          <CaseForm
            draft={draft}
            onChange={setDraft}
            onSave={handleSave}
            onCancel={cancelForm}
          />
        )}

        {isReady && activePage === "cases" && (
          <section className="entries-section" aria-labelledby="entries-title">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">Your record</p>
                  <h2 id="entries-title">Cases</h2>
                </div>
                <button
                  className="button button-secondary desktop-add"
                  onClick={startNewCase}
                >
                  <span aria-hidden="true">+</span> Add a case
                </button>
              </div>

              <div className="list-toolbar">
                <label className="search-field">
                  <span className="sr-only">Search cases</span>
                  <span className="search-icon" aria-hidden="true">
                    ⌕
                  </span>
                  <input
                    type="search"
                    placeholder="Search diagnosis, notes…"
                    value={search}
                    onChange={(event) => setSearch(event.currentTarget.value)}
                  />
                </label>
                <div className="filter-group" aria-label="Filter by supervision">
                  {(
                    [
                      ["all", "All cases"],
                      ["supervised", "Supervised"],
                      ["unsupervised", "Unsupervised"],
                    ] as const
                  ).map(([key, label]) => (
                    <button
                      className={`filter-button ${caseFilter === key ? "is-active" : ""}`}
                      key={key}
                      onClick={() => setCaseFilter(key)}
                      aria-pressed={caseFilter === key}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {filteredEntries.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon" aria-hidden="true">
                    {pathway.icon}
                  </div>
                  <h3>
                    {pathwayEntries.length === 0
                      ? "Your first case starts here"
                      : "No cases match that search"}
                  </h3>
                  <p>
                    {pathwayEntries.length === 0
                      ? "Keep a clear, de-identified record of your scans, whatever stage of practice you’re in."
                      : "Try another search or change the supervision filter."}
                  </p>
                  {pathwayEntries.length === 0 && (
                    <button
                      className="button button-primary"
                      onClick={startNewCase}
                    >
                      Add your first case
                    </button>
                  )}
                </div>
              ) : (
                <div className="case-list">
                  {filteredEntries.map((entry) => (
                    <article className="case-card" key={entry.id}>
                      <div className="case-date">
                        <span>{formatDate(entry.date)}</span>
                        {entry.caseType === "healthy_volunteer" && (
                          <span className="case-kind">Healthy volunteer</span>
                        )}
                      </div>
                      <div className="case-main">
                        <h3>{entry.diagnosis || "Scan recorded"}</h3>
                        <p>{caseSummary(entry)}</p>
                        {entry.summary && (
                          <p className="case-detail">{entry.summary}</p>
                        )}
                      </div>
                      <div className="case-meta">
                        <span
                          className={`supervision-tag ${entry.supervised ? "is-supervised" : ""}`}
                        >
                          <span aria-hidden="true">
                            {entry.supervised ? "●" : "○"}
                          </span>
                          {entry.supervised ? "Supervised" : "Independent"}
                        </span>
                        {entry.supervised && entry.supervisorName && (
                          <span className="supervisor-name">
                            with {entry.supervisorName}
                          </span>
                        )}
                      </div>
                      <div className="case-tags" aria-label="Case review markers">
                        {entry.impressionCategory !== "not_recorded" && (
                          <span
                            className={`review-tag ${
                              entry.impressionCategory === "abnormal"
                                ? "review-tag-highlight"
                                : ""
                            }`}
                          >
                            {entry.impressionCategory}
                          </span>
                        )}
                        {entry.managementImpact === "changed" && (
                          <span className="review-tag review-tag-highlight">
                            Changed management
                          </span>
                        )}
                      </div>
                      <div className="case-actions">
                        <button
                          className="text-button"
                          onClick={() => startEditing(entry)}
                          aria-label={`Edit case from ${formatDate(entry.date)}`}
                        >
                          Edit
                        </button>
                        <button
                          className="text-button text-button-danger"
                          onClick={() => void handleDelete(entry)}
                          aria-label={`Delete case from ${formatDate(entry.date)}`}
                        >
                          Delete
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
              <p className="privacy-note">
                Don’t enter patient names, dates of birth, record numbers, or
                other identifying details. This is a personal training and
                reflection log, not a clinical record.
              </p>
          </section>
        )}
      </section>

      <footer className="app-footer">
        <span>Private by default · Stored on this device</span>
        <span>Not for clinical decision-making or patient care</span>
      </footer>
    </main>
  );
}

export default App;
