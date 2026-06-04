export type TIssueTimerSegment = {
  id: string;
  segment_start: string;
  segment_end: string | null;
  duration_seconds: number;
};

export type TIssueTimer = {
  id: string;
  issue_id: string;
  issue_identifier: string;
  user_id: string;
  user_display_name: string;
  workspace_id: string;
  project_id: string;
  started_at: string;
  paused_at: string | null;
  stopped_at: string | null;
  total_duration_seconds: number;
  computed_duration_seconds: number;
  duration_display: string;
  is_running: boolean;
  is_paused: boolean;
  is_manual: boolean;
  note: string;
  segments: TIssueTimerSegment[];
  created_at: string;
  updated_at: string;
};

export type TActiveTimer = {
  issue_id: string;
  user_id: string;
  user_display_name: string;
  is_running: boolean;
  is_paused: boolean;
  issue_name?: string;
  issue_title?: string;
  last_segment_start?: string;
  started_at?: string;
  total_duration_seconds?: number;
};

export type TIssueTimerAdmin = TIssueTimer & {
  project_name: string;
  issue_name: string;
};
