import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
//hooks
import { useCycle } from "hooks/store";
// components
import { CycleIssueQuickActions } from "components/issues";
// types
import { BaseCalendarRoot } from "../base-calendar-root";
import { EIssuesStoreType } from "constants/issue";

export const CycleCalendarLayout: React.FC = observer(() => {
  const { currentProjectCompletedCycleIds } = useCycle();

  const router = useRouter();
  const { cycleId } = router.query;

  if (!cycleId) return null;

  const isCompletedCycle =
    cycleId && currentProjectCompletedCycleIds ? currentProjectCompletedCycleIds.includes(cycleId.toString()) : false;

  return (
    <BaseCalendarRoot
      QuickActions={CycleIssueQuickActions}
      viewId={cycleId.toString()}
      isCompletedCycle={isCompletedCycle}
      storeType={EIssuesStoreType.CYCLE}
    />
  );
});
