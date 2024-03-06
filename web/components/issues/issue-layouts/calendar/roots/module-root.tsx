import { observer } from "mobx-react-lite";
import { useRouter } from "next/router";
// hooks
import { ModuleIssueQuickActions } from "components/issues";
import { EIssuesStoreType } from "constants/issue";
// components
// types
import { BaseCalendarRoot } from "../base-calendar-root";

export const ModuleCalendarLayout: React.FC = observer(() => {
  const router = useRouter();
  const { moduleId } = router.query;

  if (!moduleId) return null;

  return (
    <BaseCalendarRoot
      QuickActions={ModuleIssueQuickActions}
      viewId={moduleId.toString()}
      storeType={EIssuesStoreType.MODULE}
    />
  );
});
