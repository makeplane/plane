import React from "react";
import { observer } from "mobx-react-lite";
import { useRouter } from "next/router";
// constant
import { EIssuesStoreType } from "constants/issue";
// components
import { BaseKanBanRoot } from "../base-kanban-root";
import { ProjectIssueQuickActions } from "../../quick-action-dropdowns";

export const ProjectViewKanBanLayout: React.FC = observer(() => {
  // router
  const router = useRouter();
  const { viewId } = router.query;

  return (
    <BaseKanBanRoot
      showLoader={true}
      QuickActions={ProjectIssueQuickActions}
      storeType={EIssuesStoreType.PROJECT_VIEW}
      viewId={viewId?.toString()}
    />
  );
});
