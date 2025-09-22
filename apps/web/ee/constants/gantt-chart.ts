import { TIssueRelationTypes } from "../types";

export const REVERSE_RELATIONS: { [key in TIssueRelationTypes]: TIssueRelationTypes } = {
  blocked_by: "blocking",
  blocking: "blocked_by",
  start_before: "start_after",
  start_after: "start_before",
  finish_before: "finish_after",
  finish_after: "finish_before",
  relates_to: "relates_to",
  duplicate: "duplicate",
  implements: "implemented_by",
  implemented_by: "implements",
};

export enum ETimelineRelation {
  FS = "FINISH_TO_START",
  SS = "START_TO_START",
  FF = "FINISH_TO_FINISH",
}

export enum EDependencyPosition {
  START = "START",
  END = "END",
}
