import { useRef, useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { PenSquare } from "lucide-react";
import { EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
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
// plane web components
import { AppSearch } from "@/plane-web/components/workspace/sidebar/app-search";

export const SidebarQuickActions = observer(() => {
  const { t } = useTranslation();
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
  const { toggleCreateIssueModal } = useCommandPalette();
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
          {!isSidebarCollapsed && (
            <span className="text-sm font-medium truncate max-w-[145px]">{t("sidebar.new_work_item")}</span>
          )}
        </button>
        <AppSearch />
      </div>
    </>
  );
});
