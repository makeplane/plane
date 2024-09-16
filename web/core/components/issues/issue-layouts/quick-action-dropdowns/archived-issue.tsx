"use client";

import { useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// icons
import { ArchiveRestoreIcon, ExternalLink, Link, Trash2 } from "lucide-react";
// ui
import { ContextMenu, CustomMenu, TContextMenuItem, TOAST_TYPE, setToast } from "@plane/ui";
// components
import { DeleteIssueModal } from "@/components/issues";
// constants
import { EIssuesStoreType } from "@/constants/issue";
// helpers
import { cn } from "@/helpers/common.helper";
import { copyUrlToClipboard } from "@/helpers/string.helper";
// hooks
import { useEventTracker, useIssues, useUserPermissions } from "@/hooks/store";
import { EUserPermissions, EUserPermissionsLevel } from "@/plane-web/constants/user-permissions";
// types
import { IQuickActionProps } from "../list/list-view-types";

export const ArchivedIssueQuickActions: React.FC<IQuickActionProps> = observer((props) => {
  const {
    issue,
    handleDelete,
    handleRestore,
    customActionButton,
    portalElement,
    readOnly = false,
    placements = "bottom-end",
    parentRef,
  } = props;
  // states
  const [deleteIssueModal, setDeleteIssueModal] = useState(false);
  // router
  const { workspaceSlug } = useParams();
  // store hooks
  const { allowPermissions } = useUserPermissions();

  const { setTrackElement } = useEventTracker();
  const { issuesFilter } = useIssues(EIssuesStoreType.ARCHIVED);
  // derived values
  const activeLayout = `${issuesFilter.issueFilters?.displayFilters?.layout} layout`;
  // auth
  const isEditingAllowed =
    allowPermissions([EUserPermissions.ADMIN, EUserPermissions.MEMBER], EUserPermissionsLevel.PROJECT) && !readOnly;
  const isRestoringAllowed = handleRestore && isEditingAllowed;

  const issueLink = `${workspaceSlug}/projects/${issue.project_id}/archives/issues/${issue.id}`;

  const handleOpenInNewTab = () => window.open(`/${issueLink}`, "_blank");
  const handleCopyIssueLink = () =>
    copyUrlToClipboard(issueLink).then(() =>
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Link copied",
        message: "Issue link copied to clipboard",
      })
    );
  const handleIssueRestore = async () => {
    if (!handleRestore) return;
    await handleRestore()
      .then(() => {
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: "Restore success",
          message: "Your issue can be found in project issues.",
        });
      })
      .catch(() => {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: "Issue could not be restored. Please try again.",
        });
      });
  };

  const MENU_ITEMS: TContextMenuItem[] = [
    {
      key: "restore",
      title: "Restore",
      icon: ArchiveRestoreIcon,
      action: handleIssueRestore,
      shouldRender: isRestoringAllowed,
    },
    {
      key: "open-in-new-tab",
      title: "Open in new tab",
      icon: ExternalLink,
      action: handleOpenInNewTab,
    },
    {
      key: "copy-link",
      title: "Copy link",
      icon: Link,
      action: handleCopyIssueLink,
    },
    {
      key: "delete",
      title: "Delete",
      icon: Trash2,
      action: () => {
        setTrackElement(activeLayout);
        setDeleteIssueModal(true);
      },
      shouldRender: isEditingAllowed,
    },
  ];

  return (
    <>
      <DeleteIssueModal
        data={issue}
        isOpen={deleteIssueModal}
        handleClose={() => setDeleteIssueModal(false)}
        onSubmit={handleDelete}
      />
      <ContextMenu parentRef={parentRef} items={MENU_ITEMS} />
      <CustomMenu
        ellipsis
        customButton={customActionButton}
        portalElement={portalElement}
        placement={placements}
        menuItemsClassName="z-[14]"
        maxHeight="lg"
        useCaptureForOutsideClick
        closeOnSelect
      >
        {MENU_ITEMS.map((item) => {
          if (item.shouldRender === false) return null;
          return (
            <CustomMenu.MenuItem
              key={item.key}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                item.action();
              }}
              className={cn(
                "flex items-center gap-2",
                {
                  "text-custom-text-400": item.disabled,
                },
                item.className
              )}
              disabled={item.disabled}
            >
              {item.icon && <item.icon className={cn("h-3 w-3", item.iconClassName)} />}
              <div>
                <h5>{item.title}</h5>
                {item.description && (
                  <p
                    className={cn("text-custom-text-300 whitespace-pre-line", {
                      "text-custom-text-400": item.disabled,
                    })}
                  >
                    {item.description}
                  </p>
                )}
              </div>
            </CustomMenu.MenuItem>
          );
        })}
      </CustomMenu>
    </>
  );
});
