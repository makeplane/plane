import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// hooks
import { EIssuesStoreType } from "@/constants/issue";
// components
import { BaseGanttRoot } from "./base-gantt-root";
// constants
// types

export const ProjectViewGanttLayout: React.FC = observer(() => {
  // router
  const { viewId } = useParams();

  return <BaseGanttRoot viewId={viewId?.toString()} storeType={EIssuesStoreType.PROJECT_VIEW} />;
});
