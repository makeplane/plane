import React from "react";
import { observer } from "mobx-react";
// store
// constants
// types
import { ProjectIssueQuickActions } from "../../quick-action-dropdowns";
// components
import { BaseListRoot } from "../base-list-root";

export const ProjectViewListLayout: React.FC = observer(() => <BaseListRoot QuickActions={ProjectIssueQuickActions} />);
