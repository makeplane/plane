import { observer } from "mobx-react-lite";
import { useRouter } from "next/router";
// components
import { BaseGanttRoot } from "./base-gantt-root";
import { EIssuesStoreType } from "constants/issue";

export const ModuleGanttLayout: React.FC = observer(() => {
  // router
  const router = useRouter();
  const { moduleId } = router.query;

  return <BaseGanttRoot viewId={moduleId?.toString()} storeType={EIssuesStoreType.MODULE} />;
});
