import type { CurriculumProfile } from "../types";

export const dvtFusicProfile: CurriculumProfile = {
  id: "fusic-dvt-v1",
  curriculumId: "fusic",
  pathway: "dvt",
  version: "v1",

  label: "DVT",
  source: {
    title: "FUSIC DVT Training Pack",
    version: "v1 (2026)",
    url: "https://ics.ac.uk/static/beaa5df0-fd47-4e83-9ed28e72533d2eb6/FUSIC-DVT-Training-Pack-v1-2026.pdf",
  },
  assessmentSource: {
    title: "FUSIC DVT Assessment Pack",
    version: "2026",
    url: "https://ics.ac.uk/asset/89A15FB1-7BED-4818-865C7600311B3C1A/",
  },
  totalScans: 10,
  directlySupervisedScans: 5,
  collectionWindowMonths: 12,
  accreditationWindowMonths: 24,
  scanUnit: "scan",
  caseMix: {
    pathologyRangeRequired: true,
    healthyVolunteerMaximumPercent: 10,
    minimumCaseMixRequirement: "At least one scan must demonstrate a DVT.",
    minimumPositiveScans: 1,
  },
  protocolCoverage:
    "Use at least the three-point technique (saphenofemoral junction, common femoral vein, and popliteal vein) and attempt all required views on every scan. Distal views beyond the popliteal trifurcation are optional.",
};
