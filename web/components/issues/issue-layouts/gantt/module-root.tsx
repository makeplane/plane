import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// hooks
import { EIssuesStoreType } from "@/constants/issue";
// components
import { BaseGanttRoot } from "./base-gantt-root";

export const ModuleGanttLayout: React.FC = observer(() => {
  // router
  const { moduleId } = useParams();

  return <BaseGanttRoot viewId={moduleId?.toString()} storeType={EIssuesStoreType.MODULE} />;
});
