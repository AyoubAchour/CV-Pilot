import type { CvDocument } from "../../../shared/cv-model";

export type CvUpdateKind = "typing" | "structural";

export type CvUpdateMeta = {
  kind?: CvUpdateKind;
  /**
   * Used to group rapid typing changes into a single undo step.
   * Example: "basics.fullName" or "experience[0].role".
   */
  groupKey?: string;
};

export type SetCv = (next: CvDocument, meta?: CvUpdateMeta) => void;

