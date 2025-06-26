"use client";

import { useState } from "react";
import { observer } from "mobx-react";
import { PenSquare } from "lucide-react";
import { EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
// ui
import { EIssuesStoreType } from "@plane/types";
import { Breadcrumbs, Button, Header } from "@plane/ui";
// components
import { BreadcrumbLink, CountChip } from "@/components/common";
import { CreateUpdateIssueModal } from "@/components/issues";

// hooks
import { useProject, useUserPermissions, useWorkspaceDraftIssues } from "@/hooks/store";

export const WorkspaceDraftHeader = observer(() => {
  // state
  const [isDraftIssueModalOpen, setIsDraftIssueModalOpen] = useState(false);
  // store hooks
  const { allowPermissions } = useUserPermissions();
  const { paginationInfo } = useWorkspaceDraftIssues();
  const { joinedProjectIds } = useProject();

  const { t } = useTranslation();
  // check if user is authorized to create draft work item
  const isAuthorizedUser = allowPermissions(
    [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
    EUserPermissionsLevel.WORKSPACE
  );

  return (
    <>
      <CreateUpdateIssueModal
        isOpen={isDraftIssueModalOpen}
        storeType={EIssuesStoreType.WORKSPACE_DRAFT}
        onClose={() => setIsDraftIssueModalOpen(false)}
        isDraft
      />
      <Header>
        <Header.LeftItem>
          <div className="flex items-center gap-2.5">
            <Breadcrumbs>
              <Breadcrumbs.Item
                component={
                  <BreadcrumbLink label={t("drafts")} icon={<PenSquare className="h-4 w-4 text-custom-text-300" />} />
                }
              />
            </Breadcrumbs>
            {paginationInfo?.total_count && paginationInfo?.total_count > 0 ? (
              <CountChip count={paginationInfo?.total_count} />
            ) : (
              <></>
            )}
          </div>
        </Header.LeftItem>

        <Header.RightItem>
          {joinedProjectIds && joinedProjectIds.length > 0 && (
            <Button
              variant="primary"
              size="sm"
              className="items-center gap-1"
              onClick={() => setIsDraftIssueModalOpen(true)}
              disabled={!isAuthorizedUser}
            >
              {t("workspace_draft_issues.draft_an_issue")}
            </Button>
          )}
        </Header.RightItem>
      </Header>
    </>
  );
});
