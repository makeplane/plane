import { observer } from "mobx-react";
// components
import { DraftIssueQuickActions } from "@/components/issues";
import { EIssuesStoreType } from "@/constants/issue";
import { BaseKanBanRoot } from "../base-kanban-root";

export interface IKanBanLayout {}

export const DraftKanBanLayout: React.FC = observer(() => (
  <BaseKanBanRoot showLoader QuickActions={DraftIssueQuickActions} storeType={EIssuesStoreType.DRAFT} />
));
