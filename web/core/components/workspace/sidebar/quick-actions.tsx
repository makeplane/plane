import { useRef, useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { ChevronUp, PenSquare, Search } from "lucide-react";
// types
import { TIssue } from "@plane/types";
// components
import { CreateUpdateIssueModal } from "@/components/issues";
// constants
import { EIssuesStoreType } from "@/constants/issue";
// helpers
import { cn } from "@/helpers/common.helper";
// hooks
import { useAppTheme, useCommandPalette, useEventTracker, useProject } from "@/hooks/store";
import useLocalStorage from "@/hooks/use-local-storage";

export const SidebarQuickActions = observer(() => {
  // states
  const [isDraftIssueModalOpen, setIsDraftIssueModalOpen] = useState(false);
  const [isDraftButtonOpen, setIsDraftButtonOpen] = useState(false);
  // refs
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const timeoutRef = useRef<any>();
  // router
  const { workspaceSlug: routerWorkspaceSlug } = useParams();
  const workspaceSlug = routerWorkspaceSlug?.toString();
  // store hooks
  const { toggleCreateIssueModal, toggleCommandPaletteModal } = useCommandPalette();
  const { sidebarCollapsed: isSidebarCollapsed } = useAppTheme();
  const { setTrackElement } = useEventTracker();
  const { joinedProjectIds } = useProject();
  // local storage
  const { storedValue, setValue } = useLocalStorage<Record<string, Partial<TIssue>>>("draftedIssue", {});
  // derived values
  const disabled = joinedProjectIds.length === 0;
  const workspaceDraftIssue = workspaceSlug ? storedValue?.[workspaceSlug] ?? undefined : undefined;

  const handleMouseEnter = () => {
    // if enter before time out clear the timeout
    timeoutRef?.current && clearTimeout(timeoutRef.current);
    setIsDraftButtonOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsDraftButtonOpen(false);
    }, 300);
  };

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
        className={cn("flex items-center justify-between gap-1 cursor-pointer", {
          "flex-col gap-0": isSidebarCollapsed,
        })}
      >
        <div
          className={cn(
            "relative flex-grow flex items-center justify-between gap-1 rounded h-8 hover:bg-custom-sidebar-background-90",
            {
              "size-8 aspect-square": isSidebarCollapsed,
              "px-3 border-[0.5px] border-custom-sidebar-border-300": !isSidebarCollapsed,
            }
          )}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <button
            type="button"
            className={cn(
              "relative flex flex-shrink-0 flex-grow items-center gap-2 text-custom-sidebar-text-300 rounded outline-none",
              {
                "justify-center": isSidebarCollapsed,
                "cursor-not-allowed opacity-50": disabled,
              }
            )}
            onClick={() => {
              setTrackElement("APP_SIDEBAR_QUICK_ACTIONS");
              toggleCreateIssueModal(true, EIssuesStoreType.PROJECT);
            }}
            disabled={disabled}
          >
            <PenSquare className="size-4" />
            {!isSidebarCollapsed && <span className="text-sm font-medium">New issue</span>}
          </button>
          {!disabled && workspaceDraftIssue && (
            <>
              {!isSidebarCollapsed && (
                <button type="button" className="grid place-items-center">
                  <ChevronUp
                    className={cn("size-4 transform !text-custom-sidebar-text-300 transition-transform duration-300", {
                      "rotate-180": isDraftButtonOpen,
                    })}
                  />
                </button>
              )}
              {isDraftButtonOpen && (
                <div className="absolute  mt-0 h-10 w-[220px] pt-2 z-10 top-8 left-0">
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
              )}
            </>
          )}
        </div>
        <button
          className={cn(
            "flex-shrink-0 size-8 aspect-square grid place-items-center rounded hover:bg-custom-sidebar-background-90 outline-none",
            {
              "border-[0.5px] border-custom-sidebar-border-300": !isSidebarCollapsed,
            }
          )}
          onClick={() => toggleCommandPaletteModal(true)}
        >
          <Search className="size-4 text-custom-sidebar-text-300" />
        </button>
      </div>
    </>
  );
});
