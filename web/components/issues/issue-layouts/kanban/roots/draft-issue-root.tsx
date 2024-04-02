import { observer } from "mobx-react-lite";
// components
import { DraftIssueQuickActions } from "@/components/issues";
import { BaseKanBanRoot } from "../base-kanban-root";

export interface IKanBanLayout {}

export const DraftKanBanLayout: React.FC = observer(() => <BaseKanBanRoot QuickActions={DraftIssueQuickActions} />);
