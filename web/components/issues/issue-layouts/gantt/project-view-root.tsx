import { observer } from "mobx-react";
import { useRouter } from "next/router";
// hooks
import { EIssuesStoreType } from "@/constants/issue";
// components
import { BaseGanttRoot } from "./base-gantt-root";
// constants
// types

export const ProjectViewGanttLayout: React.FC = observer(() => {
  // router
  const router = useRouter();
  const { viewId } = router.query;

  return <BaseGanttRoot viewId={viewId?.toString()} storeType={EIssuesStoreType.PROJECT_VIEW} />;
});
