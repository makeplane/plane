import { IProjectLite, IWorkspaceLite } from "@plane/types";

export interface IGptResponse {
  response: string;
  response_html: string;
  count: number;
  project_detail: IProjectLite;
  workspace_detail: IWorkspaceLite;
}

export type TProjectPlannerInput = {
  data: string;
  workspace_id: string;
  project_id: string;
};

export type TPlannerData = {
  message: string;
  task_id: string;
};

export type TPlannerStatus = "pending" | "processing" | "completed" | "failed";

export type TPlannerStatusData = {
  status: TPlannerStatus;
  message: string;
  created_at: string;
  project_id: string;
  workspace_id: string;
  task_id: string;
  progress: number;
};
