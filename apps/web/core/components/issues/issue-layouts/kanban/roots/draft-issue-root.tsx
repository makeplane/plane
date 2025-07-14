import { observer } from "mobx-react";
// components
import { DraftIssueQuickActions } from "@/components/issues";
import { BaseKanBanRoot } from "../base-kanban-root";

export const DraftKanBanLayout: React.FC = observer(() => <BaseKanBanRoot QuickActions={DraftIssueQuickActions} />);
