import { useCallback } from "react";
import { observer } from "mobx-react-lite";
// icons
import { List } from "lucide-react";
// hooks
import useLocalStorage from "hooks/use-local-storage";
// constants
import { CustomMenu } from "@plane/ui";
import { CYCLE_VIEW_LAYOUTS } from "constants/cycle";
import { TCycleLayout } from "@plane/types";

export const CyclesListMobileHeader = observer(() => {

    const { setValue: setCycleLayout } = useLocalStorage<TCycleLayout>("cycle_layout", "list");

    const handleCurrentLayout = useCallback(
        (_layout: TCycleLayout) => {
            setCycleLayout(_layout);
        },
        [setCycleLayout]
    );

    return <div className="flex justify-center sm:hidden">
        <CustomMenu
            maxHeight={"md"}
            className="flex flex-grow justify-center text-custom-text-200 text-sm py-2 border-b border-custom-border-200 bg-custom-sidebar-background-100"
            // placement="bottom-start"
            customButton={
                <span className="flex items-center gap-2">
                    <List className="h-4 w-4" />
                    <span className="flex flex-grow justify-center text-custom-text-200 text-sm">Layout</span>
                </span>
            }
            customButtonClassName="flex flex-grow justify-center items-center text-custom-text-200 text-sm"
            closeOnSelect
        >
            {CYCLE_VIEW_LAYOUTS.map((layout) => (
                <CustomMenu.MenuItem
                    onClick={() => {
                        // handleLayoutChange(ISSUE_LAYOUTS[index].key);
                        handleCurrentLayout(layout.key as TCycleLayout);
                    }}
                    className="flex items-center gap-2"
                >
                    <layout.icon className="w-3 h-3" />
                    <div className="text-custom-text-300">{layout.title}</div>
                </CustomMenu.MenuItem>
            ))}
        </CustomMenu>
    </div>
});