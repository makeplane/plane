import { observer } from "mobx-react";
// mobx store
import { ProjectIssueQuickActions } from "@/components/issues";
// components
// types
// constants
import { BaseKanBanRoot } from "../base-kanban-root";

export const KanBanLayout: React.FC = observer(() => <BaseKanBanRoot QuickActions={ProjectIssueQuickActions} />);
