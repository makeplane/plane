import React from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// hooks
// constant
// types
import { ProjectIssueQuickActions } from "../../quick-action-dropdowns";
// components
import { BaseKanBanRoot } from "../base-kanban-root";

export const ProjectViewKanBanLayout: React.FC = observer(() => {
  const { viewId } = useParams();

  return <BaseKanBanRoot QuickActions={ProjectIssueQuickActions} viewId={viewId.toString()} />;
});
