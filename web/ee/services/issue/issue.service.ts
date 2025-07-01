import { EIssueServiceType, TIssue, TIssueServiceType } from "@plane/types";
import { IssueService as CoreIssueService } from "@/services/issue/issue.service";

export class IssueService extends CoreIssueService {
  constructor(serviceType: TIssueServiceType = EIssueServiceType.ISSUES) {
    super(serviceType);
  }

  /**
   * Duplicate work item across the project
   * @param workspaceSlug - Workspace slug
   * @param workItemId - Work item ID
   * @param targetProjectId - Target project ID
   */
  async duplicateWorkItem(workspaceSlug: string, workItemId: string, targetProjectId: string): Promise<TIssue> {
    const response = await this.post(`/api/workspaces/${workspaceSlug}/issues/${workItemId}/duplicate/`, {
      project_id: targetProjectId,
    });
    return response.data;
  }
}
