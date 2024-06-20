import React from "react";
import { observer } from "mobx-react";
// hooks
// constant
// types
import { ProjectIssueQuickActions } from "../../quick-action-dropdowns";
// components
import { BaseKanBanRoot } from "../base-kanban-root";

export const ProjectViewKanBanLayout: React.FC = observer(() => (
  <BaseKanBanRoot QuickActions={ProjectIssueQuickActions} />
));
