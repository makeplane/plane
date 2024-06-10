import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// hooks
import { EIssuesStoreType } from "@/constants/issue";
// components
import { BaseGanttRoot } from "./base-gantt-root";

export const CycleGanttLayout: React.FC = observer(() => {
  // router
  const { cycleId } = useParams();

  return <BaseGanttRoot viewId={cycleId?.toString()} storeType={EIssuesStoreType.CYCLE} />;
});
