import { BasePageHandler } from "@/core/document-types/base-page/handlers";
import { HocusPocusServerContext } from "@/core/types/common";
import { WorkspacePageService } from "@/ee/services/workspace-page.service";

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
