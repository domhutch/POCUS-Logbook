export type CurriculumPathway =
  | "heart"
  | "lung"
  | "dvt"
  | "abdomen"
  | "vascular"
  | "hd"
  | "focusedToe";

interface RequirementSource {
  title: string;
  version: string;
  url: string;
}

interface ScanTypeQuota {
  scanType: string;
  minimumScans: number;
  minimumDirectlySupervised: number;
  note?: string;
}

interface LogbookRoute {
  totalScans: number;
  directlySupervisedScans: number;
  eligibility?: string;
}

interface PathwayRequirements {
  label: string;
  source: RequirementSource;
  assessmentSource?: RequirementSource;
  totalScans: number;
  directlySupervisedScans: number;
  collectionWindowMonths: number;
  accreditationWindowMonths?: number;
  scanUnit: "scan" | "examination";
  caseMix: {
    pathologyRangeRequired: boolean;
    healthyVolunteerMaximumPercent?: number;
    normalScanMaximum?: number;
    normalScanMaximumPercent?: number;
    minimumCaseMixRequirement?: string;
    minimumPositiveScans?: number;
  };
  scanTypeQuotas?: readonly ScanTypeQuota[];
  alternateLogbookRoute?: LogbookRoute;
  protocolCoverage?: string;
  effectiveDatedChanges?: readonly {
    effectiveFrom: string;
    description: string;
    source: RequirementSource;
  }[];
}

const sharedClinicalCaseMix = {
  pathologyRangeRequired: true,
  healthyVolunteerMaximumPercent: 10,
} as const;

export const PATHWAY_REQUIREMENTS: Readonly<
  Record<CurriculumPathway, PathwayRequirements>
> = {
  heart: {
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
    caseMix: sharedClinicalCaseMix,
    protocolCoverage:
      "Attempt all four FUSIC Heart views on each scan; adequate images may not be possible in every view.",
  },
  lung: {
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
    caseMix: sharedClinicalCaseMix,
    protocolCoverage:
      "Attempt all examination points on each scan, with imaging from three points on each side.",
  },
  dvt: {
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
      ...sharedClinicalCaseMix,
      minimumCaseMixRequirement: "At least one scan must demonstrate a DVT.",
      minimumPositiveScans: 1,
    },
    protocolCoverage:
      "Use at least the three-point technique (saphenofemoral junction, common femoral vein, and popliteal vein) and attempt all required views on every scan. Distal views beyond the popliteal trifurcation are optional.",
  },
  abdomen: {
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
    caseMix: sharedClinicalCaseMix,
    protocolCoverage:
      "Attempt the required FUSIC Abdomen examination points on each scan; adequate images may not be possible in every view.",
  },
  vascular: {
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
      ...sharedClinicalCaseMix,
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
  },
  hd: {
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
  },
  focusedToe: {
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
  },
};
