import { PageCoreService } from "./core.service";

export class ProjectPageService extends PageCoreService {
  protected basePath: string;

  constructor(params: any) {
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
