import { PageService } from "./extended.service";

interface ProjectPageServiceParams {
  workspaceSlug?: string;
  projectId?: string;
  cookie?: string;
  [key: string]: unknown;
}

export class ProjectPageService extends PageService {
  protected basePath: string;

  constructor(params: ProjectPageServiceParams) {
    super();
    const { workspaceSlug, projectId } = params;
    if (!workspaceSlug || !projectId) throw new Error("Missing required fields.");
    // validate cookie
    if (!params.cookie) throw new Error("Cookie is required.");
    // set cookie
    this.setHeader("Cookie", params.cookie);
    // set base path
    this.basePath = `/api/workspaces/${workspaceSlug}/projects/${projectId}`;
  }
}
