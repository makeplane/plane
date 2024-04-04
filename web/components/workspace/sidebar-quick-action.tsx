import { useRef, useState } from "react";
import { observer } from "mobx-react";
import { ChevronUp, PenSquare, Search } from "lucide-react";
// types
import { TIssue } from "@plane/types";
// components
import { CreateUpdateIssueModal } from "@/components/issues";
// constants
import { EIssuesStoreType } from "@/constants/issue";
import { EUserWorkspaceRoles } from "@/constants/workspace";
// hooks
import { useAppRouter, useAppTheme, useCommandPalette, useEventTracker, useProject, useUser } from "@/hooks/store";
import useLocalStorage from "@/hooks/use-local-storage";

export const WorkspaceSidebarQuickAction = observer(() => {
  // states
  const [isDraftIssueModalOpen, setIsDraftIssueModalOpen] = useState(false);
  // store hooks
  const { toggleCreateIssueModal, toggleCommandPaletteModal } = useCommandPalette();
  const { sidebarCollapsed: isSidebarCollapsed } = useAppTheme();
  const { workspaceSlug } = useAppRouter();
  const { setTrackElement } = useEventTracker();
  const { joinedProjectIds } = useProject();
  const {
    membership: { currentWorkspaceRole },
  } = useUser();

  const { storedValue, setValue } = useLocalStorage<Record<string, Partial<TIssue>>>("draftedIssue", {});

  //useState control for displaying draft issue button instead of group hover
  const [isDraftButtonOpen, setIsDraftButtonOpen] = useState(false);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const timeoutRef = useRef<any>();

  const isAuthorizedUser = !!currentWorkspaceRole && currentWorkspaceRole >= EUserWorkspaceRoles.MEMBER;

  const disabled = joinedProjectIds.length === 0;

  const onMouseEnter = () => {
    // if enter before time out clear the timeout
    timeoutRef?.current && clearTimeout(timeoutRef.current);
    setIsDraftButtonOpen(true);
  };

  const onMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsDraftButtonOpen(false);
    }, 300);
  };

  const workspaceDraftIssue = workspaceSlug ? storedValue?.[workspaceSlug] ?? undefined : undefined;

  const removeWorkspaceDraftIssue = () => {
    const draftIssues = storedValue ?? {};
    if (workspaceSlug && draftIssues[workspaceSlug]) delete draftIssues[workspaceSlug];
    setValue(draftIssues);
    return Promise.resolve();
  };

  return (
    <>
      <CreateUpdateIssueModal
        isOpen={isDraftIssueModalOpen}
        onClose={() => setIsDraftIssueModalOpen(false)}
        data={workspaceDraftIssue ?? {}}
        onSubmit={() => removeWorkspaceDraftIssue()}
        isDraft
      />

      <div
        className={`mt-4 flex w-full cursor-pointer items-center justify-between px-4 ${
          isSidebarCollapsed ? "flex-col gap-1" : "gap-2"
        }`}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        {isAuthorizedUser && (
          <div
            className={`relative flex w-full cursor-pointer items-center justify-between gap-1 rounded px-2 ${
              isSidebarCollapsed
                ? "px-2 hover:bg-custom-sidebar-background-80"
                : "border-[0.5px] border-custom-border-200 px-3 shadow-custom-sidebar-shadow-2xs"
            }`}
          >
            <button
              type="button"
              className={`relative flex flex-shrink-0 flex-grow items-center gap-2 rounded py-1.5 outline-none ${
                isSidebarCollapsed ? "justify-center" : ""
              } ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
              onClick={() => {
                setTrackElement("APP_SIDEBAR_QUICK_ACTIONS");
                toggleCreateIssueModal(true, EIssuesStoreType.PROJECT);
              }}
              disabled={disabled}
            >
              <PenSquare className="h-4 w-4 text-custom-sidebar-text-300" />
              {!isSidebarCollapsed && <span className="text-sm font-medium">New Issue</span>}
            </button>

            {!disabled && workspaceDraftIssue && (
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
                  <ChevronUp
                    className={`h-4 w-4 rotate-180 transform !text-custom-sidebar-text-300 transition-transform duration-300 ${
                      isDraftButtonOpen ? "rotate-0" : ""
                    }`}
                  />
                </button>

                <div
                  className={`fixed left-4 mt-0 h-10 w-[203px] pt-2 ${isSidebarCollapsed ? "top-[5.5rem]" : "top-24"} ${
                    isDraftButtonOpen ? "block" : "hidden"
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
          className={`flex flex-shrink-0 items-center gap-2 rounded p-2 outline-none ${
            isAuthorizedUser ? "justify-center" : "w-full"
          } ${
            isSidebarCollapsed
              ? "hover:bg-custom-sidebar-background-80"
              : "border-[0.5px] border-custom-border-200 shadow-custom-sidebar-shadow-2xs"
          }`}
          onClick={() => toggleCommandPaletteModal(true)}
        >
          <Search className="h-4 w-4 text-custom-sidebar-text-300" />
          {!isAuthorizedUser && !isSidebarCollapsed && <span className="text-xs font-medium">Open command menu</span>}
        </button>
      </div>
    </>
  );
});
