// plane web components
import { observer } from "mobx-react-lite";
// hooks
import { useProject } from "@/hooks/store";
import { useAnalyticsV2 } from "@/hooks/store/use-analytics-v2";
// components
import DurationDropdown from "./select/duration";
import { ProjectSelect } from "./select/project";

const AnalyticsFilterActions = observer(() => {
  const { selectedProjects, selectedDuration, updateSelectedProjects, updateSelectedDuration } = useAnalyticsV2();
  const { workspaceProjectIds } = useProject();
  return (
    <div className="flex items-center justify-end gap-2">
      <ProjectSelect
        value={selectedProjects}
        onChange={(val) => {
          updateSelectedProjects(val ?? []);
        }}
        projectIds={workspaceProjectIds}
      />
      {/* <DurationDropdown
        buttonVariant="border-with-text"
        value={selectedDuration}
        onChange={(val) => {
          updateSelectedDuration(val);
        }}
        dropdownArrow
      /> */}
    </div>
  );
});

export default AnalyticsFilterActions;
