/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { useState } from "react";
import { observer } from "mobx-react";
import { Ellipsis } from "lucide-react";
import { useParams } from "next/navigation";
// plane imports
import { EIssuesStoreType } from "@plane/types";
import { ContextMenu, CustomMenu } from "@plane/ui";
// components
import { cn } from "@plane/utils";
import { DeleteIssueModal } from "@/components/issues/delete-issue-modal";
// helpers
import type { IQuickActionProps } from "@/components/issues/issue-layouts/list/list-view-types";
// hooks
import type { MenuItemFactoryProps } from "@/components/issues/issue-layouts/quick-action-dropdowns/helper";
import { useIssues } from "@/hooks/store/use-issues";
import { useProject } from "@/hooks/store/use-project";
// helper
import { useArchivedEpicMenuItems } from "./helper";
import { IconButton } from "@plane/propel/icon-button";

type TArchivedEpicQuickActionProps = Exclude<IQuickActionProps, "readOnly" | "disabled"> & {
  toggleDeleteEpicModal?: (value: boolean) => void;
  isPeekMode?: boolean;
  permissions: {
    canEdit: boolean;
    canDelete: boolean;
    canRestore: boolean;
  };
};

export const ArchivedEpicQuickActions = observer(function ArchivedEpicQuickActions(
  props: TArchivedEpicQuickActionProps
) {
  const {
    issue,
    handleDelete,
    handleRestore,
    parentRef,
    toggleDeleteEpicModal,
    isPeekMode = false,
    portalElement,
    permissions,
  } = props;
  // router
  const { workspaceSlug } = useParams();
  // states
  const [deleteIssueModal, setDeleteIssueModal] = useState(false);
  // store hooks
  const { getProjectIdentifierById } = useProject();
  const { issuesFilter } = useIssues(EIssuesStoreType.ARCHIVED_EPIC);
  // derived values
  const activeLayout = `${issuesFilter.issueFilters?.displayFilters?.layout} layout`;
  const projectIdentifier = getProjectIdentifierById(issue?.project_id);
  const { canEdit, canDelete, canRestore } = permissions;

  const customDeleteAction = async () => {
    setDeleteIssueModal(true);
    if (toggleDeleteEpicModal) toggleDeleteEpicModal(true);
  };

  // Menu items using helper
  const menuItemProps: MenuItemFactoryProps = {
    issue,
    workspaceSlug: workspaceSlug?.toString(),
    projectIdentifier,
    activeLayout,
    canEdit,
    canDelete,
    canRestore: !!canRestore,
    setIssueToEdit: () => {},
    setCreateUpdateIssueModal: () => {},
    setDeleteIssueModal: customDeleteAction,
    handleDelete,
    handleRestore,
    // storeType: EIssuesStoreType.ARCHIVED_EPIC,
  };

  const baseMenuItems = useArchivedEpicMenuItems(menuItemProps);

  // Filter out items based on peek mode and customize actions
  const MENU_ITEMS = baseMenuItems
    .map((item) => {
      // Hide copy link in peek mode
      if (item.key === "copy-link") {
        return {
          ...item,
          shouldRender: !isPeekMode,
        };
      }
      return item;
    })
    .filter((item) => item.shouldRender !== false);

  return (
    <>
      <DeleteIssueModal
        data={issue}
        isOpen={deleteIssueModal}
        handleClose={() => {
          setDeleteIssueModal(false);
          if (toggleDeleteEpicModal) toggleDeleteEpicModal(false);
        }}
        onSubmit={handleDelete}
        isEpic
      />

      <ContextMenu parentRef={parentRef} items={MENU_ITEMS} />
      <CustomMenu
        ellipsis
        portalElement={portalElement}
        menuItemsClassName="z-[14]"
        maxHeight="lg"
        useCaptureForOutsideClick
        closeOnSelect
        customButton={<IconButton variant="secondary" icon={Ellipsis} size="lg" />}
      >
        {MENU_ITEMS.map((item) => {
          if (item.shouldRender === false) return null;

          // Render submenu if nestedMenuItems exist
          if (item.nestedMenuItems && item.nestedMenuItems.length > 0) {
            return (
              <CustomMenu.SubMenu
                key={item.key}
                trigger={
                  <div className="flex items-center gap-2">
                    {item.icon && <item.icon className={cn("h-3 w-3", item.iconClassName)} />}
                    <h5>{item.title}</h5>
                    {item.description && (
                      <p
                        className={cn("text-tertiary whitespace-pre-line", {
                          "text-placeholder": item.disabled,
                        })}
                      >
                        {item.description}
                      </p>
                    )}
                  </div>
                }
                disabled={item.disabled}
                className={cn(
                  "flex items-center gap-2",
                  {
                    "text-placeholder": item.disabled,
                  },
                  item.className
                )}
              >
                {item.nestedMenuItems.map((nestedItem) => (
                  <CustomMenu.MenuItem
                    key={nestedItem.key}
                    onClick={() => {
                      nestedItem.action();
                    }}
                    className={cn(
                      "flex items-center gap-2",
                      {
                        "text-placeholder": nestedItem.disabled,
                      },
                      nestedItem.className
                    )}
                    disabled={nestedItem.disabled}
                  >
                    {nestedItem.icon && <nestedItem.icon className={cn("h-3 w-3", nestedItem.iconClassName)} />}
                    <div>
                      <h5>{nestedItem.title}</h5>
                      {nestedItem.description && (
                        <p
                          className={cn("text-tertiary whitespace-pre-line", {
                            "text-placeholder": nestedItem.disabled,
                          })}
                        >
                          {nestedItem.description}
                        </p>
                      )}
                    </div>
                  </CustomMenu.MenuItem>
                ))}
              </CustomMenu.SubMenu>
            );
          }

          // Render regular menu item
          return (
            <CustomMenu.MenuItem
              key={item.key}
              onClick={() => {
                item.action();
              }}
              className={cn(
                "flex items-center gap-2",
                {
                  "text-placeholder": item.disabled,
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
                    className={cn("text-tertiary whitespace-pre-line", {
                      "text-placeholder": item.disabled,
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
