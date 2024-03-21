import { observer } from "mobx-react-lite";
// components
import { ProjectIssueQuickActions } from "@/components/issues";
import { EIssuesStoreType } from "@/constants/issue";
import { BaseKanBanRoot } from "../base-kanban-root";

export interface IKanBanLayout {}

export const DraftKanBanLayout: React.FC = observer(() => (
  <BaseKanBanRoot showLoader QuickActions={ProjectIssueQuickActions} storeType={EIssuesStoreType.DRAFT} />
));
