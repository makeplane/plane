import { observer } from "mobx-react";
import { useRouter } from "next/router";
// hooks
import { EIssuesStoreType } from "@/constants/issue";
// components
import { BaseGanttRoot } from "./base-gantt-root";

export const CycleGanttLayout: React.FC = observer(() => {
  // router
  const router = useRouter();
  const { cycleId } = router.query;

  return <BaseGanttRoot viewId={cycleId?.toString()} storeType={EIssuesStoreType.CYCLE} />;
});
