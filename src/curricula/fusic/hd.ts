import type { CurriculumProfile } from "../types";

export const hdFusicProfile: CurriculumProfile = {
  id: "fusic-hd-v11",
  curriculumId: "fusic",
  pathway: "hd",
  version: "v11",

  label: "HD",
  source: {
    title: "FUSIC HD Training Pack",
    version: "v11 (2026)",
    url: "https://ics.ac.uk/static/792a27d9-c0d5-479d-95ebaf79f77269f4/FUSIC-HD-Training-Pack-2026-v11.pdf",
  },
  assessmentSource: {
    title: "FUSIC HD Assessment Pack",
    version: "2026.v1.1",
    url: "https://ics.ac.uk/asset/E1ADF59F-6927-4AD3-B765C4B10F133C35/",
  },
  totalScans: 50,
  directlySupervisedScans: 20,
  collectionWindowMonths: 12,
  accreditationWindowMonths: 24,
  scanUnit: "scan",
  caseMix: {
    pathologyRangeRequired: true,
    healthyVolunteerMaximumPercent: 10,
    normalScanMaximum: 10,
    minimumCaseMixRequirement: "No more than 10 of the 50 logbook scans should be normal.",
  },
  protocolCoverage:
    "Attempt the full minimum dataset across the ten clinical questions on each scan; the guide recognises that some views may not be possible in some patients.",
  effectiveDatedChanges: [
    {
      effectiveFrom: "2026-02-01",
      description:
        "For scans on or after this date, include LVEF, RV fractional area change, RV dimensions, detailed pulmonary hypertension assessment including Doppler, and the revised left atrial pressure algorithm. Earlier scans do not need to be repeated.",
      source: {
        title: "Updates to the FUSIC HD Minimum Dataset and Competency Requirements",
        version: "2026.v1 (January 2026; effective February 2026)",
        url: "https://ics.ac.uk/asset/18CFE7A1-A0C6-440B-9F03E03FD387F298/",
      },
    },
  ],
};
