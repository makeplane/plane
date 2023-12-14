import React, { useState } from "react";

// ui
import { ChevronUp, PenSquare, Search } from "lucide-react";
// hooks
import useLocalStorage from "hooks/use-local-storage";
// components
import { CreateUpdateDraftIssueModal } from "components/issues";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
import { observer } from "mobx-react-lite";
import { EProjectStore } from "store/command-palette.store";
// constants
import { EUserWorkspaceRoles } from "constants/workspace";

export const WorkspaceSidebarQuickAction = observer(() => {
  // states
  const [isDraftIssueModalOpen, setIsDraftIssueModalOpen] = useState(false);

  const {
    theme: themeStore,
    commandPalette: commandPaletteStore,
    trackEvent: { setTrackElement },
    user: { currentWorkspaceRole },
  } = useMobxStore();

  const { storedValue, clearValue } = useLocalStorage<any>("draftedIssue", JSON.stringify({}));

  const isSidebarCollapsed = themeStore.sidebarCollapsed;

  const isAuthorizedUser = !!currentWorkspaceRole && currentWorkspaceRole >= EUserWorkspaceRoles.MEMBER;

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
        className={`mt-4 flex w-full cursor-pointer items-center justify-between px-4 ${
          isSidebarCollapsed ? "flex-col gap-1" : "gap-2"
        }`}
      >
        {isAuthorizedUser && (
          <div
            className={`group relative flex w-full cursor-pointer items-center justify-between gap-1 rounded px-2 ${
              isSidebarCollapsed
                ? "px-2 hover:bg-custom-sidebar-background-80"
                : "border-[0.5px] border-custom-border-200 px-3 shadow-custom-sidebar-shadow-2xs"
            }`}
          >
            <button
              type="button"
              className={`relative flex flex-shrink-0 flex-grow items-center gap-2 rounded py-1.5 outline-none ${
                isSidebarCollapsed ? "justify-center" : ""
              }`}
              onClick={() => {
                setTrackElement("APP_SIDEBAR_QUICK_ACTIONS");
                commandPaletteStore.toggleCreateIssueModal(true, EProjectStore.PROJECT);
              }}
            >
              <PenSquare className="h-4 w-4 text-custom-sidebar-text-300" />
              {!isSidebarCollapsed && <span className="text-sm font-medium">New Issue</span>}
            </button>

            {storedValue && Object.keys(JSON.parse(storedValue)).length > 0 && (
              <>
                <div
                  className={`h-8 w-0.5 bg-custom-sidebar-background-80 ${isSidebarCollapsed ? "hidden" : "block"}`}
                />

                <button
                  type="button"
                  className={`ml-1.5 flex flex-shrink-0 items-center justify-center rounded py-1.5 ${
                    isSidebarCollapsed ? "hidden" : "block"
                  }`}
                >
                  <ChevronUp className="h-4 w-4 rotate-180 transform !text-custom-sidebar-text-300 transition-transform duration-300 group-hover:rotate-0" />
                </button>

                <div
                  className={`pointer-events-none fixed left-4 mt-0 h-10 w-[203px] pt-2 opacity-0 group-hover:pointer-events-auto group-hover:opacity-100 ${
                    isSidebarCollapsed ? "top-[5.5rem]" : "top-24"
                  }`}
                >
                  <div className="h-full w-full">
                    <button
                      onClick={() => setIsDraftIssueModalOpen(true)}
                      className="flex w-full flex-shrink-0 items-center rounded border-[0.5px] border-custom-border-300 bg-custom-background-100 px-3 py-[10px] text-sm text-custom-text-300 shadow"
                    >
                      <PenSquare size={16} className="mr-2 !text-lg !leading-4 text-custom-sidebar-text-300" />
                      Last Drafted Issue
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        <button
          className={`flex flex-shrink-0 items-center rounded p-2 gap-2 outline-none ${
            isAuthorizedUser ? "justify-center" : "w-full"
          } ${
            isSidebarCollapsed
              ? "hover:bg-custom-sidebar-background-80"
              : "border-[0.5px] border-custom-border-200 shadow-custom-sidebar-shadow-2xs"
          }`}
          onClick={() => commandPaletteStore.toggleCommandPaletteModal(true)}
        >
          <Search className="h-4 w-4 text-custom-sidebar-text-300" />
          {!isAuthorizedUser && !isSidebarCollapsed && <span className="text-xs font-medium">Open command menu</span>}
        </button>
      </div>
    </>
  );
});
