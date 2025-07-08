import { TeamspacePageService } from "@/ee/services/teamspace-page.service";
import { HocusPocusServerContext } from "@/core/types/common";
import { BasePageHandler } from "@/core/document-types/base-page/handlers";

export interface TeamspacePageConfig {
  teamspaceId: string | undefined;
  workspaceSlug: string | undefined;
}

const teamspacePageService = new TeamspacePageService();

export class TeamspacePageHandler extends BasePageHandler<TeamspacePageService, TeamspacePageConfig> {
  protected documentType = "teamspace_page";

  constructor() {
    super(teamspacePageService);
  }

  protected getConfig(context: HocusPocusServerContext): TeamspacePageConfig {
    return {
      teamspaceId: context.teamspaceId,
      workspaceSlug: context.workspaceSlug,
    };
  }
}

// Create singleton instance
export const teamspacePageHandler = new TeamspacePageHandler();
