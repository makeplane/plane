import { WorkspacePageService } from "@/ee/services/workspace-page.service";
import { HocusPocusServerContext } from "@/core/types/common";
import { BasePageHandler } from "@/core/document-types/base-page/handlers";

export interface WorkspacePageConfig {
  workspaceSlug: string | undefined;
}

const workspacePageService = new WorkspacePageService();

export class WorkspacePageHandler extends BasePageHandler<WorkspacePageService, WorkspacePageConfig> {
  protected documentType = "workspace_page";

  constructor() {
    super(workspacePageService);
  }

  protected getConfig(context: HocusPocusServerContext): WorkspacePageConfig {
    return {
      workspaceSlug: context.workspaceSlug,
    };
  }
}

// Create singleton instance
export const workspacePageHandler = new WorkspacePageHandler();
