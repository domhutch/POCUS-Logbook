import type { CurriculumProfile } from "../types";

export const abdomenFusicProfile: CurriculumProfile = {
  id: "fusic-abdomen-v11",
  curriculumId: "fusic",
  pathway: "abdomen",
  version: "v11",

  label: "Abdomen",
  source: {
    title: "FUSIC Abdomen Training Pack",
    version: "v11 (2025)",
    url: "https://ics.ac.uk/static/ef0ddaff-73a2-484d-95acc7a5ab3be630/FUSICAbdomen-Training-Packv11-2025.pdf",
  },
  assessmentSource: {
    title: "FUSIC Abdomen Assessment Pack",
    version: "v11 (2025)",
    url: "https://ics.ac.uk/static/4f58cbc7-b6d1-4ed4-9dcb9d4990a126ec/FUSIC-Abdomen-Assessment-Pack-2025-v11.pdf",
  },
  totalScans: 25,
  directlySupervisedScans: 10,
  collectionWindowMonths: 12,
  accreditationWindowMonths: 24,
  scanUnit: "scan",
  caseMix: {
    pathologyRangeRequired: true,
    healthyVolunteerMaximumPercent: 10,
  },
  protocolCoverage:
    "Attempt the required FUSIC Abdomen examination points on each scan; adequate images may not be possible in every view.",
};
