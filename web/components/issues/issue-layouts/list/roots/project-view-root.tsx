import React from "react";
import { observer } from "mobx-react-lite";
import { useRouter } from "next/router";
// store
import { useIssues } from "hooks/store";
// constants
import { EIssuesStoreType } from "constants/issue";
// types
import { EIssueActions } from "../../types";
import { TIssue } from "@plane/types";
// components
import { BaseListRoot } from "../base-list-root";
import { ProjectIssueQuickActions } from "../../quick-action-dropdowns";

export const ProjectViewListLayout: React.FC = observer(() => {
  const router = useRouter();
  const { workspaceSlug, projectId, viewId } = router.query;

  if (!workspaceSlug || !projectId) return null;

  return (
    <BaseListRoot
      QuickActions={ProjectIssueQuickActions}
      storeType={EIssuesStoreType.PROJECT_VIEW}
      viewId={viewId?.toString()}
    />
  );
});
