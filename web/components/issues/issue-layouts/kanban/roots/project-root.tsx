import { observer } from "mobx-react-lite";
// components
import { ProjectIssueQuickActions } from "components/issues";
import { BaseKanBanRoot } from "../base-kanban-root";
import { EIssuesStoreType } from "constants/issue";

export const KanBanLayout: React.FC = observer(() => (
  <BaseKanBanRoot showLoader={true} QuickActions={ProjectIssueQuickActions} storeType={EIssuesStoreType.PROJECT} />
));
