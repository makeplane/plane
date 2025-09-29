import { IState } from "../state";

export enum E_STATE_MAP_KEYS {
  DRAFT_MR_OPENED = "DRAFT_MR_OPENED",
  MR_OPENED = "MR_OPENED",
  MR_REVIEW_REQUESTED = "MR_REVIEW_REQUESTED",
  MR_READY_FOR_MERGE = "MR_READY_FOR_MERGE",
  MR_MERGED = "MR_MERGED",
  MR_CLOSED = "MR_CLOSED",
}

export type TStateMapKeys = keyof typeof E_STATE_MAP_KEYS;

export type TStateMap = {
  [key in TStateMapKeys]: IState | undefined;
};
