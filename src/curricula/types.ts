export type CurriculumPathway =
  | "heart"
  | "lung"
  | "dvt"
  | "abdomen"
  | "vascular"
  | "hd"
  | "focusedToe";

export type ActiveCurriculumPathway = Exclude<CurriculumPathway, "focusedToe">;

export interface RequirementSource {
  title: string;
  version: string;
  url: string;
}

export interface ScanTypeQuota {
  scanType: string;
  minimumScans: number;
  minimumDirectlySupervised: number;
  note?: string;
}

export interface LogbookRoute {
  totalScans: number;
  directlySupervisedScans: number;
  eligibility?: string;
}

export interface PathwayRequirements {
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

export interface CurriculumProfile extends PathwayRequirements {
  id: string;
  curriculumId: string;
  pathway: CurriculumPathway;
  version: string;
}
