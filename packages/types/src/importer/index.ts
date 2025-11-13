export * from "./github-importer";
export * from "./jira-importer";

import type { IProjectLite } from "../project";
// types
import type { IUserLite } from "../users";

export interface IImporterService {
  created_at: string;
  config: {
    sync: boolean;
  };
  created_by: string | null;
  data: {
    users: [];
  };
  id: string;
  initiated_by: string;
  initiated_by_detail: IUserLite;
  metadata: {
    name: string;
    owner: string;
    repository_id: number;
    url: string;
  };
  project: string;
  project_detail: IProjectLite;
  service: string;
  status: "processing" | "completed" | "failed";
  updated_at: string;
  updated_by: string;
  token: string;
  workspace: string;
}

export interface IExportData {
  id: string;
  created_at: string;
  updated_at: string;
  project: string[];
  provider: string;
  status: string;
  url: string;
  token: string;
  created_by: string;
  updated_by: string;
  initiated_by_detail: IUserLite;
}
export interface IExportServiceResponse {
  count: number;
  extra_stats: null;
  next_cursor: string;
  next_page_results: boolean;
  prev_cursor: string;
  prev_page_results: boolean;
  results: IExportData[];
  total_pages: number;
}
