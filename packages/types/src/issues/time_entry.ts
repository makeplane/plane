import type { IUserLite } from "../users";

export type TTimeEntryEditableFields = {
  time_spent: number; // Time in seconds
  description?: string | null;
  started_at?: string | null;
  ended_at?: string | null;
  is_timer?: boolean;
  user?: string | null;
};

export type TTimeEntry = TTimeEntryEditableFields & {
  id: string;
  issue_id: string;
  project_id: string;
  workspace_id: string;
  user: string;
  user_detail?: IUserLite;
  time_spent_hours?: number;
  time_spent_formatted?: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
};

export type TTimeEntryMap = {
  [time_entry_id: string]: TTimeEntry;
};

export type TTimeEntrySummary = {
  total_seconds: number;
  total_hours: number;
  entry_count: number;
  time_by_user: Array<{
    user_id: string;
    display_name: string;
    avatar: string | null;
    total_seconds: number;
    total_hours: number;
  }>;
};
