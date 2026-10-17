import type { CurriculumProfile } from "../types";

export const lungFusicProfile: CurriculumProfile = {
  id: "fusic-lung-v10",
  curriculumId: "fusic",
  pathway: "lung",
  version: "v10",

  label: "Lung",
  source: {
    title: "FUSIC Lung Training Pack",
    version: "v10 (2025)",
    url: "https://ics.ac.uk/static/947f68af-d44d-4c7a-ab16d6697ee897b0/FUSICLung-Training-Pack-2025-V10.pdf",
  },
  totalScans: 30,
  directlySupervisedScans: 10,
  collectionWindowMonths: 12,
  scanUnit: "scan",
  caseMix: {
    pathologyRangeRequired: true,
    healthyVolunteerMaximumPercent: 10,
  },
  protocolCoverage:
    "Attempt all examination points on each scan, with imaging from three points on each side.",
};
