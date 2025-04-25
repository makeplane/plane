// hooks
import { useAnalyticsV2 } from "@/hooks/store/use-analytics-v2";
// plane web components
import { observer } from "mobx-react-lite";
// components
import { ProjectDropdown } from "@/components/dropdowns";
import DurationDropdown from "./duration-dropdown";

const AnalyticsFilterActions = observer(() => {
    const { selectedProject, selectedDuration, updateSelectedProject, updateSelectedDuration } = useAnalyticsV2()

    return (
        <div className="flex items-center justify-end gap-2">
            <ProjectDropdown
                value={selectedProject}
                onChange={(val) => {
                    updateSelectedProject(val)
                }}
                buttonVariant="border-with-text"
                multiple={false}
                dropdownArrow
            />
            <DurationDropdown
                buttonVariant="border-with-text"
                value={selectedDuration}
                onChange={(val) => {
                    updateSelectedDuration(val)
                }}
                dropdownArrow
            />
        </div>
    )
})

export default AnalyticsFilterActions