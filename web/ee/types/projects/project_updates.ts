import { EUpdateStatus } from "@plane/types/src/enums";
import { TProjectUpdateReaction } from "./update_reaction";

export enum EProjectUpdateStatus {
  OFF_TRACK = "OFF-TRACK",
  ON_TRACK = "ON-TRACK",
  AT_RISK = "AT-RISK",
}

export type TProjectUpdate = {
  id: string;
  status: EUpdateStatus;
  description: string;
  created_by: string;
  updated_at: string;
  update_reactions: TProjectUpdateReaction[];
  comments_count: number;
  completed_issues: number;
  total_issues: number;
};
