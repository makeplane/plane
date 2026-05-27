import type { IRosterPlayerPayload, TRosterPlayerStatus } from "@plane/types";
import { TRosterDisplayPropertyKey, TRosterGroupByOption, TRosterOrderByOption } from "../roster-context";


export const POSITION_OPTIONS = ["All positions", "QB", "RB", "WR", "TE", "LB", "DB"];
export const STATUS_OPTIONS = ["All statuses", "Active", "Injured", "Inactive", "Pending"];
export const CLASS_YEAR_OPTIONS = ["All classes", "Freshman", "Sophomore", "Junior", "Senior", "Graduate"];

export const ROSTER_DISPLAY_PROPERTIES: { key: TRosterDisplayPropertyKey; label: string }[] = [
  { key: "player", label: "Player" },
  { key: "jersey_number", label: "Jersey #" },
  { key: "position", label: "Position" },
  { key: "height", label: "Height" },
  { key: "weight", label: "Weight" },
  { key: "class_year", label: "Class/Year" },
  { key: "status", label: "Status" },
  { key: "notes", label: "Notes" },
  { key: "created_at", label: "Created at" },
  { key: "updated_at", label: "Updated at" },
];

export const GROUP_BY_OPTIONS: { key: TRosterGroupByOption; label: string }[] = [
  { key: "none", label: "None" },
  { key: "position", label: "Position" },
  { key: "status", label: "Status" },
  { key: "class_year", label: "Class/Year" },
];

export const ORDER_BY_OPTIONS: { key: TRosterOrderByOption; label: string }[] = [
  { key: "manual", label: "Manual" },
  { key: "player_name", label: "Player name" },
  { key: "jersey_number", label: "Jersey #" },
  { key: "position", label: "Position" },
  { key: "status", label: "Status" },
  { key: "-created_at", label: "Last created" },
  { key: "-updated_at", label: "Last updated" },
];

export const STATUS_VALUES: TRosterPlayerStatus[] = ["active", "injured", "inactive", "pending"];

export const ROSTER_HEADER_MAP: Record<keyof IRosterPlayerPayload, string[]> = {
  player_name: ["player name", "name", "player"],
  jersey_number: ["jersey #", "jersey", "jersey number", "number", "#"],
  position: ["position", "pos"],
  height: ["height", "ht"],
  weight: ["weight", "wt"],
  class_year: ["class/year", "class year", "class", "year"],
  status: ["status"],
  notes: ["notes", "note"],
};
