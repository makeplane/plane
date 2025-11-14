import type { IProjectLite } from "./project";
import type { IWorkspaceLite } from "./workspace";

export interface IGptResponse {
  response: string;
  response_html: string;
  count: number;
  project_detail: IProjectLite;
  workspace_detail: IWorkspaceLite;
}
