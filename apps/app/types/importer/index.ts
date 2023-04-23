export * from "./github-importer";
export * from "./jira-importer";

import { IProjectLite } from "types/projects";
// types
import { IUserLite } from "types/users";

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
