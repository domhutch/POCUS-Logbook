import type { ActiveCurriculumPathway, CurriculumPathway, CurriculumProfile } from "../types";
import { abdomenFusicProfile } from "./abdomen";
import { dvtFusicProfile } from "./dvt";
import { focusedToeFusicProfile } from "./focused-toe";
import { hdFusicProfile } from "./hd";
import { heartFusicProfile } from "./heart";
import { lungFusicProfile } from "./lung";
import { vascularFusicProfile } from "./vascular";

export const FUSIC_CURRICULUM = {
  id: "fusic",
  name: "FUSIC",
  activeProfiles: {
    heart: heartFusicProfile,
    lung: lungFusicProfile,
    dvt: dvtFusicProfile,
    abdomen: abdomenFusicProfile,
    vascular: vascularFusicProfile,
    hd: hdFusicProfile,
  } satisfies Record<ActiveCurriculumPathway, CurriculumProfile>,
  futureProfiles: {
    focusedToe: focusedToeFusicProfile,
  } satisfies Partial<Record<CurriculumPathway, CurriculumProfile>>,
} as const;

export function getDefaultCurriculumProfile(pathway: ActiveCurriculumPathway) {
  return FUSIC_CURRICULUM.activeProfiles[pathway];
}

// Compatibility catalogue for existing screens and reference tests.
export const PATHWAY_REQUIREMENTS: Readonly<Record<CurriculumPathway, CurriculumProfile>> = {
  ...FUSIC_CURRICULUM.activeProfiles,
  ...FUSIC_CURRICULUM.futureProfiles,
};
