export enum CONSTANTS {
  NO_PERMISSION_ERROR = "do not have permission",
  NO_PERMISSION_ERROR_MESSAGE = "You don't have permission to access this resource.",
  SOMETHING_WENT_WRONG = "Something went wrong. Please try again.",
}

export enum E_STATE_MAP_KEYS {
  DRAFT_MR_OPENED = "DRAFT_MR_OPENED",
  MR_OPENED = "MR_OPENED",
  MR_REVIEW_REQUESTED = "MR_REVIEW_REQUESTED",
  MR_READY_FOR_MERGE = "MR_READY_FOR_MERGE",
  MR_MERGED = "MR_MERGED",
  MR_CLOSED = "MR_CLOSED",
}

export const GITHUB_LABEL = "github";
export const PLANE_LABEL = "plane";