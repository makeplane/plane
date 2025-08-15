import { observer } from "mobx-react";
import { BaseKanBanRoot } from "@/components/issues/issue-layouts/kanban/base-kanban-root";
import { ProjectEpicQuickActions } from "@/plane-web/components/epics";

export const EpicKanBanLayout: React.FC = observer(() => (
  <BaseKanBanRoot QuickActions={ProjectEpicQuickActions} isEpic />
));
