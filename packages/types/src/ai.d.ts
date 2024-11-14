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
