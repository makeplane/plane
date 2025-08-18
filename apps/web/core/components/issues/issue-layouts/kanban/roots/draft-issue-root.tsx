import { observer } from "mobx-react";
// local imports
import { DraftIssueQuickActions } from "../../quick-action-dropdowns";
import { BaseKanBanRoot } from "../base-kanban-root";

export const DraftKanBanLayout: React.FC = observer(() => <BaseKanBanRoot QuickActions={DraftIssueQuickActions} />);
