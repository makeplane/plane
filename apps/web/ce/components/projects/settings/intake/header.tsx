import { useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { RefreshCcw } from "lucide-react";
// ui
import { EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { Breadcrumbs, Header } from "@plane/ui";
// components
import { BreadcrumbLink } from "@/components/common/breadcrumb-link";
import { InboxIssueCreateModalRoot } from "@/components/inbox/modals/create-modal";
// hooks
import { useProject } from "@/hooks/store/use-project";
import { useProjectInbox } from "@/hooks/store/use-project-inbox";
import { useUserPermissions } from "@/hooks/store/user";
// plane web imports
import { CommonProjectBreadcrumbs } from "@/plane-web/components/breadcrumbs/common";
import { IntakeIcon } from "@plane/propel/icons";

export const ProjectInboxHeader = observer(function ProjectInboxHeader() {
  // states
  const [createIssueModal, setCreateIssueModal] = useState(false);
  // router
  const { workspaceSlug, projectId } = useParams();
  // store hooks
  const { allowPermissions } = useUserPermissions();
  const { t } = useTranslation();

  const { currentProjectDetails, loader: currentProjectDetailsLoader } = useProject();
  const { loader } = useProjectInbox();

  // derived value
  const isAuthorized = allowPermissions(
    [EUserPermissions.ADMIN, EUserPermissions.MEMBER, EUserPermissions.GUEST],
    EUserPermissionsLevel.PROJECT
  );

  return (
    <Header>
      <Header.LeftItem>
        <div className="flex items-center gap-4 flex-grow">
          <Breadcrumbs isLoading={currentProjectDetailsLoader === "init-loader"}>
            <CommonProjectBreadcrumbs workspaceSlug={workspaceSlug?.toString()} projectId={projectId?.toString()} />
            <Breadcrumbs.Item
              component={
                <BreadcrumbLink
                  label="Intake"
                  href={`/${workspaceSlug}/projects/${projectId}/intake/`}
                  icon={<IntakeIcon className="h-4 w-4 text-tertiary" />}
                  isLast
                />
              }
              isLast
            />
          </Breadcrumbs>

          {loader === "pagination-loading" && (
            <div className="flex items-center gap-1.5 text-tertiary">
              <RefreshCcw className="h-3.5 w-3.5 animate-spin" />
              <p className="text-13">{t("syncing")}...</p>
            </div>
          )}
        </div>
      </Header.LeftItem>
      <Header.RightItem>
        {currentProjectDetails?.inbox_view && workspaceSlug && projectId && isAuthorized ? (
          <div className="flex items-center gap-2">
            <InboxIssueCreateModalRoot
              workspaceSlug={workspaceSlug.toString()}
              projectId={projectId.toString()}
              modalState={createIssueModal}
              handleModalClose={() => setCreateIssueModal(false)}
            />
            <Button variant="primary" size="lg" onClick={() => setCreateIssueModal(true)}>
              {t("add_work_item")}
            </Button>
          </div>
        ) : (
          <></>
        )}
      </Header.RightItem>
    </Header>
  );
});
