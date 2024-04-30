import { observer } from "mobx-react";
// mobx store
import { ProjectIssueQuickActions } from "@/components/issues";
import { EIssuesStoreType } from "@/constants/issue";
// components
// types
// constants
import { BaseKanBanRoot } from "../base-kanban-root";

export const KanBanLayout: React.FC = observer(() => (
  <BaseKanBanRoot showLoader QuickActions={ProjectIssueQuickActions} storeType={EIssuesStoreType.PROJECT} />
));
