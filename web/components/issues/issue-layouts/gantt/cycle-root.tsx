import { observer } from "mobx-react-lite";
import { useRouter } from "next/router";
// components
import { BaseGanttRoot } from "./base-gantt-root";
import { EIssuesStoreType } from "constants/issue";

export const CycleGanttLayout: React.FC = observer(() => {
  // router
  const router = useRouter();
  const { cycleId } = router.query;

  return <BaseGanttRoot viewId={cycleId?.toString()} storeType={EIssuesStoreType.CYCLE} />;
});
