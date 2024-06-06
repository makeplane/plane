import React from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// hooks
import { EIssuesStoreType } from "@/constants/issue";
// constant
// types
import { ProjectIssueQuickActions } from "../../quick-action-dropdowns";
// components
import { BaseKanBanRoot } from "../base-kanban-root";

export const ProjectViewKanBanLayout: React.FC = observer(() => {
  // router
  const { viewId } = useParams();

  return (
    <BaseKanBanRoot
      showLoader
      QuickActions={ProjectIssueQuickActions}
      storeType={EIssuesStoreType.PROJECT_VIEW}
      viewId={viewId?.toString()}
    />
  );
});
