"use client";

import { FC, Fragment, useState } from "react";
// components
import { observer } from "mobx-react";
import { EUserPermissionsLevel } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { EIssuesStoreType, EUserWorkspaceRoles } from "@plane/types";
import { DetailedEmptyState } from "@/components/empty-state";
import { CreateUpdateIssueModal } from "@/components/issues";
// constants
import { useUserPermissions } from "@/hooks/store";
import { useResolvedAssetPath } from "@/hooks/use-resolved-asset-path";

export const WorkspaceDraftEmptyState: FC = observer(() => {
  // state
  const [isDraftIssueModalOpen, setIsDraftIssueModalOpen] = useState(false);
  // store hooks
  const { t } = useTranslation();
  const { allowPermissions } = useUserPermissions();
  // derived values
  const canPerformEmptyStateActions = allowPermissions(
    [EUserWorkspaceRoles.ADMIN, EUserWorkspaceRoles.MEMBER],
    EUserPermissionsLevel.WORKSPACE
  );
  const resolvedPath = useResolvedAssetPath({ basePath: "/empty-state/onboarding/cycles" });

  return (
    <Fragment>
      <CreateUpdateIssueModal
        isOpen={isDraftIssueModalOpen}
        storeType={EIssuesStoreType.WORKSPACE_DRAFT}
        onClose={() => setIsDraftIssueModalOpen(false)}
        isDraft
      />
      <div className="relative h-full w-full overflow-y-auto">
        <DetailedEmptyState
          title={t("workspace_draft_issues.empty_state.title")}
          description={t("workspace_draft_issues.empty_state.description")}
          assetPath={resolvedPath}
          primaryButton={{
            text: t("workspace_draft_issues.empty_state.primary_button.text"),
            onClick: () => {
              setIsDraftIssueModalOpen(true);
            },
            disabled: !canPerformEmptyStateActions,
          }}
        />
      </div>
    </Fragment>
  );
});
