import { useMemo, useState } from "react";
import type { LogbookCase, Pathway } from "../domain/logbook";

export type CaseFilter = "all" | "supervised" | "unsupervised";

function searchableClinicalDetails(entry: LogbookCase) {
  if (entry.pathway === "lung") {
    return [
      ...entry.regions,
      entry.ventilatorySupport,
      ...Object.values(entry.findings).flatMap((findings) =>
        Object.entries(findings).flat(),
      ),
    ];
  }
  if (entry.pathway === "abdomen") return [
    ...entry.examinationPoints, entry.rightUpperQuadrant, entry.leftUpperQuadrant,
    entry.rightKidney, entry.leftKidney, entry.freeFluid, entry.otherComments,
  ];
  if (entry.pathway === "dvt") return [
    entry.otherComments,
    ...Object.entries(entry.findings).flatMap(([site, findings]) => [
      site,
      ...Object.entries(findings).flatMap(([finding, value]) => [finding, value]),
    ]),
  ];
  if (entry.pathway === "hd") return [
    entry.otherComments,
    ...Object.entries(entry.questionFindings).flat(),
    ...Object.values(entry.questionNotes),
    ...Object.values(entry.measurements),
  ];
  if (entry.pathway === "vascular") return [
    entry.procedureCategory, entry.procedure, entry.insertionSite, entry.lineType, entry.piccMidlineSubstitution ? "PICC/midline quota substitute" : "",
    entry.otherComments, ...Object.entries(entry.assessments).flat(),
  ];
  return [
    ...entry.views,
    entry.ventilatorySupport,
    entry.cardiovascularSupport,
    ...Object.entries(entry.findings).flatMap(([finding, result]) => [
      finding,
      result,
    ]),
  ];
}

export function useCaseList(entries: LogbookCase[], pathway: Pathway) {
  const [search, setSearch] = useState("");
  const [caseFilter, setCaseFilter] = useState<CaseFilter>("all");

  const pathwayEntries = useMemo(
    () => entries.filter((entry) => entry.pathway === pathway),
    [entries, pathway],
  );

  const filteredEntries = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return pathwayEntries
      .filter((entry) => {
        if (caseFilter === "supervised" && !entry.supervised) return false;
        if (caseFilter === "unsupervised" && entry.supervised) return false;
        if (!query) return true;

        const caseType =
          entry.caseType === "healthy_volunteer" ? "healthy volunteer" : "clinical";
        const searchableValues = [
          entry.date,
          caseType,
          entry.diagnosis,
          entry.indication,
          entry.summary,
          entry.reflection,
          entry.supervisorName,
          ...searchableClinicalDetails(entry),
        ];
        return searchableValues.some((value) =>
          value.toLocaleLowerCase().includes(query),
        );
      })
      .sort(
        (first, second) =>
          second.date.localeCompare(first.date) ||
          second.updatedAt.localeCompare(first.updatedAt),
      );
  }, [caseFilter, pathwayEntries, search]);

  function resetFilters() {
    setSearch("");
    setCaseFilter("all");
  }

  return {
    pathwayEntries,
    filteredEntries,
    search,
    setSearch,
    caseFilter,
    setCaseFilter,
    resetFilters,
  };
}
