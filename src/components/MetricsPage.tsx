import { useState } from "react";
import type { CaseMetrics, MetricCount } from "../domain/metrics";
import { summarizeCases, type MetricsPeriod } from "../domain/metrics";
import type { LogbookCase, Pathway } from "../domain/logbook";

interface MetricsPageProps {
  cases: LogbookCase[];
  pathway: Pathway;
  isSampleData: boolean;
  canPreviewSamples: boolean;
  onToggleSampleData: () => void;
  onAddCase: () => void;
}

function Breakdown({
  title,
  description,
  items,
}: {
  title: string;
  description: string;
  items: MetricCount[];
}) {
  const maxCount = Math.max(1, ...items.map((item) => item.count));

  return (
    <section className="metrics-panel" aria-label={title}>
      <div className="metrics-panel-heading">
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
      <ul className="metrics-breakdown">
        {items.map((item) => (
          <li className="metrics-breakdown-row" key={item.label}>
            <span className="metrics-breakdown-label">{item.label}</span>
            <span className="metrics-bar-track" aria-hidden="true">
              <span
                className="metrics-bar-fill"
                style={{ width: `${(item.count / maxCount) * 100}%` }}
              />
            </span>
            <strong>{item.count}</strong>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Activity({
  metrics,
  period,
  onPeriodChange,
}: {
  metrics: CaseMetrics;
  period: MetricsPeriod;
  onPeriodChange: (period: MetricsPeriod) => void;
}) {
  const maxCount = Math.max(1, ...metrics.monthlyActivity.map((item) => item.count));

  return (
    <section className="metrics-panel metrics-activity" aria-labelledby="activity-title">
      <div className="metrics-panel-heading">
        <div>
          <h3 id="activity-title">Case activity</h3>
          <p>
            {period === "calendar_year"
              ? "Cases recorded per month this calendar year"
              : "Cases recorded per month over the rolling 12-month period"}
          </p>
        </div>
        <div className="metrics-period-control" role="group" aria-label="Activity period">
          <button
            type="button"
            aria-pressed={period === "rolling_12_months"}
            className={period === "rolling_12_months" ? "is-active" : ""}
            onClick={() => onPeriodChange("rolling_12_months")}
          >
            Rolling 12 months
          </button>
          <button
            type="button"
            aria-pressed={period === "calendar_year"}
            className={period === "calendar_year" ? "is-active" : ""}
            onClick={() => onPeriodChange("calendar_year")}
          >
            Calendar year
          </button>
        </div>
      </div>
      <ul className="metrics-breakdown">
        {metrics.monthlyActivity.map((month) => (
          <li className="metrics-breakdown-row" key={month.key}>
            <span className="metrics-breakdown-label">{month.label}</span>
            <span
              className="metrics-bar-track"
              role="progressbar"
              aria-label={`${month.label}: ${month.count} cases`}
              aria-valuemin={0}
              aria-valuemax={maxCount}
              aria-valuenow={month.count}
            >
              <span
                className="metrics-bar-fill"
                style={{
                  width: `${(month.count / maxCount) * 100}%`,
                }}
              />
            </span>
            <strong>{month.count}</strong>
          </li>
        ))}
      </ul>
    </section>
  );
}

function MetricsPage({
  cases,
  pathway,
  isSampleData,
  canPreviewSamples,
  onToggleSampleData,
  onAddCase,
}: MetricsPageProps) {
  const [period, setPeriod] = useState<MetricsPeriod>("rolling_12_months");
  const metrics = summarizeCases(cases, pathway, new Date(), period);

  return (
    <section className="metrics-page" aria-labelledby="metrics-heading">
      <div className="metrics-heading">
        <div>
          <p className="eyebrow">Personal review</p>
          <h2 id="metrics-heading">Metrics</h2>
          <p className="metrics-intro">
            Explore patterns in your recorded {pathway === "lung" ? "lung" : pathway === "heart" ? "heart" : "abdomen"} cases.
            These summaries describe your logbook; they do not assess competence.
          </p>
        </div>
        {canPreviewSamples && (
          <button
            className="button button-secondary metrics-demo-toggle"
            type="button"
            onClick={onToggleSampleData}
          >
            {isSampleData ? "Show my cases" : "Preview sample data"}
          </button>
        )}
      </div>

      {isSampleData && (
        <p className="metrics-demo-notice" role="status">
          Sample data preview · these example cases are not saved to your logbook.
        </p>
      )}

      {metrics.totalCases === 0 ? (
        <div className="metrics-empty">
          <h3>No cases to summarize yet</h3>
          <p>Once you have recorded cases, this page will show activity and case-detail patterns.</p>
          <button className="button button-primary" type="button" onClick={onAddCase}>
            Add an {pathway === "abdomen" ? "abdomen" : pathway === "lung" ? "lung" : "heart"} case
          </button>
        </div>
      ) : (
        <>
          <div className="metrics-summary" aria-label="Metrics overview">
            <article className="metrics-summary-card">
              <span>Cases included</span>
              <strong>{metrics.totalCases}</strong>
              <small>{isSampleData ? "Example dataset" : "All recorded cases for this pathway"}</small>
            </article>
            <article className="metrics-summary-card">
              <span>Activity in period</span>
              <strong>
                {metrics.monthlyActivity.reduce((total, month) => total + month.count, 0)}
              </strong>
              <small>
                {period === "calendar_year" ? "Cases this calendar year" : "Cases in the rolling 12 months"}
              </small>
            </article>
          </div>
          <div className="metrics-grid">
            <Activity metrics={metrics} period={period} onPeriodChange={setPeriod} />
            <Breakdown
              title={pathway === "lung" ? "Regions attempted" : pathway === "heart" ? "Views obtained" : "Examination points attempted"}
              description={pathway === "abdomen" ? "Number of cases with each required examination point recorded" : "Number of cases with each region or view recorded"}
              items={metrics.scanDetails}
            />
            <Breakdown
              title={pathway === "abdomen" ? "Structured details recorded" : "Findings marked Yes"}
              description={
                pathway === "abdomen"
                  ? "Cases with structured renal and free-fluid details recorded"
                  : pathway === "lung"
                  ? "Cases with each finding marked Yes in at least one region"
                  : "Cases with each finding marked Yes"
              }
              items={metrics.findings}
            />
            <Breakdown
              title="Image quality"
              description="Recorded quality for each case"
              items={metrics.imageQuality}
            />
            <Breakdown
              title="Impression category"
              description="Personal review markers"
              items={metrics.impressions}
            />
            <Breakdown
              title="Management impact"
              description="Recorded impact markers"
              items={metrics.managementImpact}
            />
          </div>
        </>
      )}
      <p className="metrics-footnote">
        Counts reflect only what was entered in this pathway’s logbook. Missing fields are shown
        as “Not recorded”; they are not treated as negative findings.
      </p>
    </section>
  );
}

export default MetricsPage;
