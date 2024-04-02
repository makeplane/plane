import { observer } from "mobx-react-lite";
import { useRouter } from "next/router";
// hooks
// components
import { BaseGanttRoot } from "./base-gantt-root";

export const ModuleGanttLayout: React.FC = observer(() => {
  // router
  const router = useRouter();
  const { moduleId } = router.query;

  return <BaseGanttRoot viewId={moduleId?.toString()} />;
});
