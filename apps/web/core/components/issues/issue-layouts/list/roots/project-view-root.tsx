import React from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// store
// constants
// types
import { ProjectIssueQuickActions } from "../../quick-action-dropdowns";
// components
import { BaseListRoot } from "../base-list-root";

export const ProjectViewListLayout = observer(function ProjectViewListLayout() {
  const { viewId } = useParams();

  return <BaseListRoot QuickActions={ProjectIssueQuickActions} viewId={viewId.toString()} />;
});
