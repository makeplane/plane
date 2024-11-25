import { useRef, useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { ChevronUp, PenSquare, Search } from "lucide-react";
// types
import { TIssue } from "@plane/types";
// components
import { CreateUpdateIssueModal } from "@/components/issues";
// constants
// helpers
import { cn } from "@/helpers/common.helper";
// hooks
import { useAppTheme, useCommandPalette, useEventTracker, useProject, useUserPermissions } from "@/hooks/store";
import useLocalStorage from "@/hooks/use-local-storage";
import { EUserPermissions, EUserPermissionsLevel } from "@/plane-web/constants/user-permissions";

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
  const { allowPermissions } = useUserPermissions();
  // local storage
  const { storedValue, setValue } = useLocalStorage<Record<string, Partial<TIssue>>>("draftedIssue", {});
  // derived values
  const canCreateIssue = allowPermissions(
    [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
    EUserPermissionsLevel.WORKSPACE
  );
  const disabled = joinedProjectIds.length === 0 || !canCreateIssue;
  const workspaceDraftIssue = workspaceSlug ? (storedValue?.[workspaceSlug] ?? undefined) : undefined;

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
        <button
          type="button"
          className={cn(
            "relative flex flex-shrink-0 flex-grow items-center gap-2 h-8 text-custom-sidebar-text-300 rounded outline-none hover:bg-custom-sidebar-background-90",
            {
              "justify-center size-8 aspect-square": isSidebarCollapsed,
              "cursor-not-allowed opacity-50 ": disabled,
              "px-3 border-[0.5px] border-custom-sidebar-border-300": !isSidebarCollapsed,
            }
          )}
          onClick={() => {
            setTrackElement("APP_SIDEBAR_QUICK_ACTIONS");
            toggleCreateIssueModal(true);
          }}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          disabled={disabled}
        >
          <PenSquare className="size-4" />
          {!isSidebarCollapsed && <span className="text-sm font-medium">New issue</span>}
        </button>
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
