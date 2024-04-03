import { observer } from "mobx-react";
import { useRouter } from "next/router";
// hooks
import { EIssuesStoreType } from "@/constants/issue";
// components
import { BaseGanttRoot } from "./base-gantt-root";

export const ModuleGanttLayout: React.FC = observer(() => {
  // router
  const router = useRouter();
  const { moduleId } = router.query;

  return <BaseGanttRoot viewId={moduleId?.toString()} storeType={EIssuesStoreType.MODULE} />;
});
