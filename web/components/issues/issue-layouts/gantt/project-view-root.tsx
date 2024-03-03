import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
// components
import { BaseGanttRoot } from "./base-gantt-root";
// constants
import { EIssuesStoreType } from "constants/issue";

export const ProjectViewGanttLayout: React.FC = observer(() => {
  // router
  const router = useRouter();
  const { viewId } = router.query;

  return <BaseGanttRoot viewId={viewId?.toString()} storeType={EIssuesStoreType.PROJECT_VIEW} />;
});
