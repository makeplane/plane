import { observer } from "mobx-react-lite";
import { useRouter } from "next/router";
//hooks
import { CycleIssueQuickActions } from "components/issues";
import { EIssuesStoreType } from "constants/issue";
import { useCycle } from "hooks/store";
// components
// types
import { BaseCalendarRoot } from "../base-calendar-root";

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
