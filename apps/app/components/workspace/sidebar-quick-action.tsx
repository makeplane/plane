import React from "react";

// ui
import { Icon } from "components/ui";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";

export const WorkspaceSidebarQuickAction = () => {
  const store: any = useMobxStore();

  return (
    <div
      className={`flex items-center justify-between w-full cursor-pointer px-4 mt-4 ${
        store?.theme?.sidebarCollapsed ? "flex-col gap-1" : "gap-2"
      }`}
    >
      <button
        className={`flex items-center gap-2 flex-grow rounded flex-shrink-0  py-1.5 ${
          store?.theme?.sidebarCollapsed
            ? "px-2 hover:bg-custom-sidebar-background-80"
            : "px-3 shadow border-[0.5px] border-custom-border-300"
        }`}
        onClick={() => {
          const e = new KeyboardEvent("keydown", { key: "c" });
          document.dispatchEvent(e);
        }}
      >
        <Icon iconName="edit_square" className="!text-lg !leading-4 text-custom-sidebar-text-300" />
        {!store?.theme?.sidebarCollapsed && <span className="text-sm font-medium">New Issue</span>}
      </button>

      <button
        className={`flex items-center justify-center rounded flex-shrink-0 p-2 ${
          store?.theme?.sidebarCollapsed
            ? "hover:bg-custom-sidebar-background-80"
            : "shadow border-[0.5px] border-custom-border-300"
        }`}
        onClick={() => {
          const e = new KeyboardEvent("keydown", { key: "k", ctrlKey: true, metaKey: true });
          document.dispatchEvent(e);
        }}
      >
        <Icon iconName="search" className="!text-lg !leading-4 text-custom-sidebar-text-300" />
      </button>
    </div>
  );
};
