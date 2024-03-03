import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
// components
import { ModuleIssueQuickActions } from "components/issues";
import { BaseCalendarRoot } from "../base-calendar-root";
import { EIssuesStoreType } from "constants/issue";

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
