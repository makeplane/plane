import { IProjectLite, IWorkspaceLite } from "@plane/types";

export type GptApiResponse = {
  response: string;
  response_html: string;
  count: number;
  project_detail: IProjectLite;
  workspace_detail: IWorkspaceLite;
};
