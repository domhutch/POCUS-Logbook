import type { CurriculumProfile } from "../types";

export const focusedToeFusicProfile: CurriculumProfile = {
  id: "fusic-focused-toe-v11",
  curriculumId: "fusic",
  pathway: "focusedToe",
  version: "v11",

  label: "Focused TOE (fTOE)",
  source: {
    title: "Focused TOE Certification Training Pack",
    version: "v11 (2025)",
    url: "https://ics.ac.uk/static/286c0975-e7d1-4f98-a1eaf18489dc1d6d/Focused-TOE-Certification-Training-Packv11-2025.pdf",
  },
  totalScans: 50,
  directlySupervisedScans: 20,
  collectionWindowMonths: 12,
  accreditationWindowMonths: 24,
  scanUnit: "examination",
  caseMix: {
    pathologyRangeRequired: true,
    normalScanMaximumPercent: 50,
  },
  alternateLogbookRoute: {
    totalScans: 30,
    directlySupervisedScans: 20,
    eligibility:
      "For candidates with accreditation in FUSIC Heart (formerly FICE), FUSIC HD, BSE Level 1, BSE Level 2 (TTE or ACCE), EACVI, or EDEC.",
  },
  protocolCoverage:
    "The fTOE minimum dataset is eight views; each examination must include the minimum dataset and a completed report.",
};
