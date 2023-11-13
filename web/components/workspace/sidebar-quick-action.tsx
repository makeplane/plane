import React, { useState } from "react";

// ui
import { ChevronDown, PenSquare, Search } from "lucide-react";
// hooks
import useLocalStorage from "hooks/use-local-storage";
// components
import { CreateUpdateDraftIssueModal } from "components/issues";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
import { observer } from "mobx-react-lite";

export const WorkspaceSidebarQuickAction = observer(() => {
  // states
  const [isDraftIssueModalOpen, setIsDraftIssueModalOpen] = useState(false);

  const { theme: themeStore, commandPalette: commandPaletteStore } = useMobxStore();

  const { storedValue, clearValue } = useLocalStorage<any>("draftedIssue", JSON.stringify({}));

  const isSidebarCollapsed = themeStore.sidebarCollapsed;

  return (
    <>
      <CreateUpdateDraftIssueModal
        isOpen={isDraftIssueModalOpen}
        handleClose={() => setIsDraftIssueModalOpen(false)}
        prePopulateData={storedValue ? JSON.parse(storedValue) : {}}
        onSubmit={() => {
          localStorage.removeItem("draftedIssue");
          clearValue();
        }}
        fieldsToShow={["all"]}
      />

      <div
        className={`flex items-center justify-between w-full cursor-pointer px-4 mt-4 ${
          isSidebarCollapsed ? "flex-col gap-1" : "gap-2"
        }`}
      >
        <div
          className={`relative flex items-center justify-between w-full rounded cursor-pointer px-2 gap-1 group ${
            isSidebarCollapsed
              ? "px-2 hover:bg-custom-sidebar-background-80"
              : "px-3 shadow border-[0.5px] border-custom-border-300"
          }`}
        >
          <button
            type="button"
            className={`relative flex items-center gap-2 flex-grow rounded flex-shrink-0 py-1.5 ${
              isSidebarCollapsed ? "justify-center" : ""
            }`}
            onClick={() => commandPaletteStore.toggleCreateIssueModal(true)}
          >
            <PenSquare className="h-4 w-4 text-custom-sidebar-text-300" />
            {!isSidebarCollapsed && <span className="text-sm font-medium">New Issue</span>}
          </button>

          {storedValue && Object.keys(JSON.parse(storedValue)).length > 0 && (
            <>
              <div className={`h-8 w-0.5 bg-custom-sidebar-background-80 ${isSidebarCollapsed ? "hidden" : "block"}`} />

              <button
                type="button"
                className={`flex items-center justify-center rounded flex-shrink-0 py-1.5 ml-1.5 ${
                  isSidebarCollapsed ? "hidden" : "block"
                }`}
              >
                <ChevronDown
                  size={16}
                  className="!text-custom-sidebar-text-300 transform transition-transform duration-300 group-hover:rotate-180 rotate-0"
                />
              </button>

              <div
                className={`fixed h-10 pt-2 w-[203px] left-4 opacity-0 group-hover:opacity-100 mt-0 pointer-events-none group-hover:pointer-events-auto ${
                  isSidebarCollapsed ? "top-[5.5rem]" : "top-24"
                }`}
              >
                <div className="w-full h-full">
                  <button
                    onClick={() => setIsDraftIssueModalOpen(true)}
                    className="w-full flex text-sm items-center rounded flex-shrink-0 py-[10px] px-3 bg-custom-background-100 shadow border-[0.5px] border-custom-border-300 text-custom-text-300"
                  >
                    <PenSquare size={16} className="!text-lg !leading-4 text-custom-sidebar-text-300 mr-2" />
                    Last Drafted Issue
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        <button
          className={`flex items-center justify-center rounded flex-shrink-0 p-2 ${
            isSidebarCollapsed
              ? "hover:bg-custom-sidebar-background-80"
              : "shadow border-[0.5px] border-custom-border-300"
          }`}
          onClick={() => commandPaletteStore.toggleCommandPaletteModal(true)}
        >
          <Search className="h-4 w-4 text-custom-sidebar-text-300" />
        </button>
      </div>
    </>
  );
});
