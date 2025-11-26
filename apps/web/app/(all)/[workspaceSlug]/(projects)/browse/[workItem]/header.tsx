import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane imports
import { Header, Row } from "@plane/ui";
// components
import { AppHeader } from "@/components/core/app-header";
import { TabNavigationRoot } from "@/components/navigation";
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { useProjectNavigationPreferences } from "@/hooks/use-navigation-preferences";
// local components
import { WorkItemDetailsHeader } from "./work-item-header";

export const ProjectWorkItemDetailsHeader = observer(function ProjectWorkItemDetailsHeader() {
  // router
  const { workspaceSlug, workItem } = useParams();
  // store hooks
  const {
    issue: { getIssueById, getIssueIdByIdentifier },
  } = useIssueDetail();
  // derived values
  const issueId = getIssueIdByIdentifier(workItem?.toString());
  const issueDetails = issueId ? getIssueById(issueId?.toString()) : undefined;
  // preferences
  const { preferences: projectPreferences } = useProjectNavigationPreferences();

  return (
    <>
      {projectPreferences.navigationMode === "horizontal" && (
        <div className="z-20">
          <Row className="h-header flex gap-2 w-full items-center border-b border-custom-border-200 bg-custom-sidebar-background-100">
            <div className="flex items-center gap-2 divide-x divide-custom-border-100 h-full w-full">
              <div className="flex items-center h-full w-full flex-1">
                <Header className="h-full">
                  <Header.LeftItem className="h-full max-w-full">
                    <TabNavigationRoot
                      workspaceSlug={workspaceSlug}
                      projectId={issueDetails?.project_id?.toString() ?? ""}
                    />
                  </Header.LeftItem>
                </Header>
              </div>
            </div>
          </Row>
        </div>
      )}
      <AppHeader header={<WorkItemDetailsHeader />} />
    </>
  );
});
