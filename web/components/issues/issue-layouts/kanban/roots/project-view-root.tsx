import React from "react";
import { observer } from "mobx-react-lite";
import { useRouter } from "next/router";
// hooks
// constant
// types
import { ProjectIssueQuickActions } from "../../quick-action-dropdowns";
// components
import { BaseKanBanRoot } from "../base-kanban-root";

export const ProjectViewKanBanLayout: React.FC = observer(() => {
  // router
  const router = useRouter();
  const { viewId } = router.query;

  return <BaseKanBanRoot QuickActions={ProjectIssueQuickActions} viewId={viewId?.toString()} />;
});
