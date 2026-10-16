import { formatCaseDate } from "../domain/case-display";
import { PATHWAYS, type LogbookCase, type Pathway } from "../domain/logbook";

type CaseFilter = "all" | "supervised" | "unsupervised";

interface CaseListProps {
  entries: LogbookCase[];
  pathwayEntries: LogbookCase[];
  caseNumbers: ReadonlyMap<string, number>;
  pathway: Pathway;
  search: string;
  caseFilter: CaseFilter;
  onSearchChange: (value: string) => void;
  onFilterChange: (filter: CaseFilter) => void;
  onAddFirstCase: () => void;
  onReview: (entry: LogbookCase) => void;
  onPrint: (entry: LogbookCase) => void;
  onEdit: (entry: LogbookCase) => void;
  onDelete: (entry: LogbookCase) => void;
}

function caseSummary(entry: LogbookCase) {
  const hasStructuredDetails =
    entry.pathway === "lung" ? entry.regions.length > 0 : entry.views.length > 0;
  const scanDetails = hasStructuredDetails
    ? entry.pathway === "lung"
      ? `${entry.regions.length} of 6 regions recorded`
      : `${entry.views.length} views recorded`
    : "Structured details not added";
  return [entry.indication, scanDetails].filter(Boolean).join(" · ");
}

function CaseList({
  entries,
  pathwayEntries,
  caseNumbers,
  pathway,
  search,
  caseFilter,
  onSearchChange,
  onFilterChange,
  onAddFirstCase,
  onReview,
  onPrint,
  onEdit,
  onDelete,
}: CaseListProps) {
  return (
    <section className="entries-section" aria-label="Cases">
      {pathwayEntries.length > 0 && (
        <div className="list-toolbar">
          <label className="search-field">
            <span className="sr-only">Search cases</span>
            <span className="search-icon" aria-hidden="true">⌕</span>
            <input
              type="search"
              placeholder="Search diagnosis, notes…"
              value={search}
              onChange={(event) => onSearchChange(event.currentTarget.value)}
            />
          </label>
          <div className="filter-group" aria-label="Filter by supervision">
            {([
              ["all", "All cases"],
              ["supervised", "Supervised"],
              ["unsupervised", "Unsupervised"],
            ] as const).map(([key, label]) => (
              <button
                className={`filter-button ${caseFilter === key ? "is-active" : ""}`}
                key={key}
                onClick={() => onFilterChange(key)}
                aria-pressed={caseFilter === key}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {entries.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon" aria-hidden="true">{PATHWAYS[pathway].icon}</div>
          <h3>{pathwayEntries.length === 0 ? "Your first case starts here" : "No cases match that search"}</h3>
          <p>
            {pathwayEntries.length === 0
              ? "Keep a clear, de-identified record of your scans, whatever stage of practice you’re in."
              : "Try another search or change the supervision filter."}
          </p>
          {pathwayEntries.length === 0 && (
            <button className="button button-primary" onClick={onAddFirstCase}>
              Add your first case
            </button>
          )}
        </div>
      ) : (
        <div className="case-list">
          {entries.map((entry) => {
            const date = formatCaseDate(entry.date, "en-GB", {
              day: "numeric",
              month: "short",
              year: "numeric",
            });
            return (
              <article className="case-card" key={entry.id}>
                <div className="case-date">
                  <span>{date}</span>
                  {entry.caseType === "healthy_volunteer" && <span className="case-kind">Healthy volunteer</span>}
                </div>
                <div className="case-main">
                  <h3>
                    {PATHWAYS[pathway].label.replace(/^FUSIC\s+/, "")} Case {caseNumbers.get(entry.id)}
                  </h3>
                  {entry.diagnosis && <p className="case-diagnosis">{entry.diagnosis}</p>}
                  <p>{caseSummary(entry)}</p>
                  {entry.summary && <p className="case-detail">{entry.summary}</p>}
                </div>
                <div className="case-meta">
                  <span className={`supervision-tag ${entry.supervised ? "is-supervised" : ""}`}>
                    <span aria-hidden="true">{entry.supervised ? "●" : "○"}</span>
                    {entry.supervised ? "Supervised" : "Independent"}
                  </span>
                  {entry.supervised && entry.supervisorName && (
                    <span className="supervisor-name">with {entry.supervisorName}</span>
                  )}
                </div>
                <div className="case-tags" aria-label="Case review markers">
                  {entry.impressionCategory !== "not_recorded" && (
                    <span className={`review-tag ${entry.impressionCategory === "abnormal" ? "review-tag-highlight" : ""}`}>
                      {entry.impressionCategory}
                    </span>
                  )}
                  {entry.managementImpact === "changed" && <span className="review-tag review-tag-highlight">Changed management</span>}
                </div>
                <div className="case-actions">
                  <button className="text-button" onClick={() => onReview(entry)} aria-label={`Review ${PATHWAYS[pathway].label} case ${caseNumbers.get(entry.id)} from ${date}`}>Review</button>
                  <button className="text-button" onClick={() => onPrint(entry)} aria-label={`Print or save ${PATHWAYS[pathway].label} case ${caseNumbers.get(entry.id)} from ${date} as PDF`}>Print / PDF</button>
                  <button className="text-button" onClick={() => onEdit(entry)} aria-label={`Edit ${PATHWAYS[pathway].label} case ${caseNumbers.get(entry.id)} from ${date}`}>Edit</button>
                  <button className="text-button text-button-danger" onClick={() => onDelete(entry)} aria-label={`Delete ${PATHWAYS[pathway].label} case ${caseNumbers.get(entry.id)} from ${date}`}>Delete</button>
                </div>
              </article>
            );
          })}
        </div>
      )}
      <p className="privacy-note">
        Don’t enter patient names, dates of birth, record numbers, or other identifying details. This is a personal training and reflection log, not a clinical record.
      </p>
    </section>
  );
}

export default CaseList;
