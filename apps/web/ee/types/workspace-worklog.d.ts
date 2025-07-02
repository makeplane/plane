export type TDefaultPaginatedInfo = {
  next_cursor: string | undefined;
  prev_cursor: string | undefined;
  next_page_results: boolean | undefined;
  prev_page_results: boolean | undefined;
  total_pages: number | undefined;
  extra_stats: string | undefined;
  count: number | undefined; // current paginated results count
  total_count: number | undefined; // total available results count
  grouped_by: string | undefined;
  sub_grouped_by: string | undefined;
};

export type TWorklogIssue = {
  id: string | undefined;
  sequence_id: number | undefined;
  name: string | undefined;
};

export type TWorklog = {
  id: string | undefined;
  description: string | undefined;
  logged_by: string | undefined;
  duration: number | undefined;
  workspace_id: string | undefined;
  project_id: string | undefined;
  issue_detail: TWorklogIssue | undefined;
  created_by: string | undefined;
  updated_by: string | undefined;
  created_at: string | undefined;
  updated_at: string | undefined;
};

export type TWorklogPaginatedInfo = TDefaultPaginatedInfo & {
  results: TWorklog[] | undefined;
};

export type TWorklogFilterKeys = "logged_by" | "project" | "created_at";

export type TWorklogFilter = {
  [key in TWorklogFilterKeys]: string[];
};

export type TWorklogFilterQueryParams = { [key in TWorklogFilterKeys]?: string | undefined };

export type TWorklogQueryParams = TWorklogFilterQueryParams & {
  per_page?: number | undefined;
  cursor?: string | undefined;
};

// worklog downloads
export type TWorklogDownloadFormat = "csv" | "xlsx";

export type TWorklogDownloadStatus = "queued" | "processing" | "completed" | "failed" | "expired";

export type TWorklogDownload = {
  id: string | undefined;
  name: string | undefined;
  type: string | undefined;
  filters: TWorklogFilter | undefined;
  provider: TWorklogDownloadFormat | undefined;
  status: TWorklogDownloadStatus | undefined;
  url: string | undefined;
  token: string | undefined;
  workspace: string | undefined;
  project: string | undefined;
  initiated_by: string | undefined;
  created_by: string | undefined;
  updated_by: string | undefined;
  created_at: string | undefined;
  updated_at: string | undefined;
};

export type TWorklogDownloadPaginatedInfo = TDefaultPaginatedInfo & {
  results: TWorklogDownload[] | undefined;
};

// worklog issue total count
export type TWorklogIssueTotalCount = {
  total_worklog: number | undefined;
};
