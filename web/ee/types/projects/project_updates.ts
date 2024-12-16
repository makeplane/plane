import { TProjectUpdateReaction } from "./update_reaction";

export enum EProjectUpdateStatus {
  OFF_TRACK = "OFF-TRACK",
  ON_TRACK = "ON-TRACK",
  AT_RISK = "AT-RISK",
}

export type TProjectUpdate = {
  id: string;
  status: EProjectUpdateStatus;
  description: string;
  created_by: string;
  updated_at: string;
  update_reactions: TProjectUpdateReaction[];
};
