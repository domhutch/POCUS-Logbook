import type { CurriculumProfile } from "../types";

export const vascularFusicProfile: CurriculumProfile = {
  id: "fusic-vascular-v1",
  curriculumId: "fusic",
  pathway: "vascular",
  version: "v1",

  label: "Vascular",
  source: {
    title: "FUSIC Vascular Training Pack",
    version: "v1 (2026)",
    url: "https://ics.ac.uk/static/57fbde91-95b6-44c9-89fbe7ba577cd952/FUSICVascular-Training-Pack-v1-2026.pdf",
  },
  assessmentSource: {
    title: "FUSIC Vascular Assessment Pack",
    version: "2026",
    url: "https://ics.ac.uk/asset/9E05D301-0951-4BF8-A1E535C7A3933107/",
  },
  totalScans: 30,
  directlySupervisedScans: 5,
  collectionWindowMonths: 12,
  scanUnit: "scan",
  caseMix: {
    pathologyRangeRequired: true,
    healthyVolunteerMaximumPercent: 10,
    minimumCaseMixRequirement: "At least one scan must demonstrate vascular access.",
  },
  scanTypeQuotas: [
    {
      scanType: "Central venous catheter (internal jugular, with or without femoral)",
      minimumScans: 5,
      minimumDirectlySupervised: 3,
    },
    {
      scanType: "PICC or midline",
      minimumScans: 3,
      minimumDirectlySupervised: 1,
      note: "If PICC/midline scans are unavailable, these may be substituted with peripheral lines.",
    },
    {
      scanType: "Peripheral vascular access",
      minimumScans: 2,
      minimumDirectlySupervised: 1,
    },
  ],
  protocolCoverage:
    "Attempt the required FUSIC Vascular views on each scan; adequate images may not be possible in every view.",
};
