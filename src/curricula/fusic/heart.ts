import type { CurriculumProfile } from "../types";

export const heartFusicProfile: CurriculumProfile = {
  id: "fusic-heart-v13",
  curriculumId: "fusic",
  pathway: "heart",
  version: "v13",

  label: "Heart",
  source: {
    title: "FUSIC Heart Training Pack",
    version: "v13 (2025)",
    url: "https://ics.ac.uk/static/fbd90d07-49c8-4290-b59715a3922911aa/FUSIC-Heart-Training-Pack-v13-2025.pdf",
  },
  totalScans: 50,
  directlySupervisedScans: 10,
  collectionWindowMonths: 12,
  accreditationWindowMonths: 24,
  scanUnit: "scan",
  caseMix: {
    pathologyRangeRequired: true,
    healthyVolunteerMaximumPercent: 10,
  },
  protocolCoverage:
    "Attempt all four FUSIC Heart views on each scan; adequate images may not be possible in every view.",
};
