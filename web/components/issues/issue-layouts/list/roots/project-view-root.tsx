import React from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// store
import { EIssuesStoreType } from "@/constants/issue";
// constants
// types
import { ProjectIssueQuickActions } from "../../quick-action-dropdowns";
// components
import { BaseListRoot } from "../base-list-root";

export const ProjectViewListLayout: React.FC = observer(() => {
  const { workspaceSlug, projectId, viewId } = useParams();

  if (!workspaceSlug || !projectId) return null;

  return (
    <BaseListRoot
      QuickActions={ProjectIssueQuickActions}
      storeType={EIssuesStoreType.PROJECT_VIEW}
      viewId={viewId?.toString()}
    />
  );
});
