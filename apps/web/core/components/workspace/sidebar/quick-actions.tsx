import { useRef, useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane imports
import { EUserPermissions, EUserPermissionsLevel, SIDEBAR_TRACKER_ELEMENTS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { AddIcon } from "@plane/propel/icons";
import type { TIssue } from "@plane/types";
import { cn } from "@plane/utils";
// components
import { CreateUpdateIssueModal } from "@/components/issues/issue-modal/modal";
import { SidebarAddButton } from "@/components/sidebar/add-button";
// hooks
import { useCommandPalette } from "@/hooks/store/use-command-palette";
import { useProject } from "@/hooks/store/use-project";
import { useUserPermissions } from "@/hooks/store/user";
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
    if (timeoutRef?.current) {
      clearTimeout(timeoutRef.current);
    }
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
        fetchIssueDetails={false}
        isDraft
      />
      <div className="flex items-center justify-between gap-2 cursor-pointer">
        <SidebarAddButton
          label={
            <>
              <AddIcon className="size-4" />
              <span className="text-sm font-medium truncate max-w-[145px]">{t("sidebar.new_work_item")}</span>
            </>
          }
          onClick={() => toggleCreateIssueModal(true)}
          disabled={disabled}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          data-ph-element={SIDEBAR_TRACKER_ELEMENTS.CREATE_WORK_ITEM_BUTTON}
        />
        <AppSearch />
      </div>
    </>
  );
});
