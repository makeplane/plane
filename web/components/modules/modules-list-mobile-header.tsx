import { observer } from "mobx-react-lite";
// hooks
import useLocalStorage from "hooks/use-local-storage";
// icons
import { GanttChartSquare, LayoutGrid, List } from "lucide-react";
// constants
import { CustomMenu } from "@plane/ui";
import { MODULE_VIEW_LAYOUTS } from "constants/module";

export const ModulesListMobileHeader = observer(() => {

    const { storedValue: modulesView, setValue: setModulesView } = useLocalStorage("modules_view", "grid");

    return <div className="flex justify-center md:hidden">
        <CustomMenu
            maxHeight={"md"}
            className="flex flex-grow justify-center text-custom-text-200 text-sm py-2 border-b border-custom-border-200 bg-custom-sidebar-background-100"
            // placement="bottom-start"
            customButton={
                <span className="flex items-center gap-2">
                    {modulesView === 'gantt_chart' ? <GanttChartSquare className="w-3 h-3" /> : modulesView === 'grid' ? <LayoutGrid className="w-3 h-3" /> : <List className="w-3 h-3" />}
                    <span className="flex flex-grow justify-center text-custom-text-200 text-sm">Layout</span>
                </span>
            }
            customButtonClassName="flex flex-grow justify-center items-center text-custom-text-200 text-sm"
            closeOnSelect
        >
            {MODULE_VIEW_LAYOUTS.map((layout) => (
                <CustomMenu.MenuItem
                    onClick={() => setModulesView(layout.key)}
                    className="flex items-center gap-2"
                >
                    <layout.icon className="w-3 h-3" />
                    <div className="text-custom-text-300">{layout.title}</div>
                </CustomMenu.MenuItem>
            ))}
        </CustomMenu>
    </div>
})