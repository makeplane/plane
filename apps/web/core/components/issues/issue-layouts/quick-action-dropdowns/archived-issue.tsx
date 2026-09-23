/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// ui
import { EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
import { EIssuesStoreType } from "@plane/types";
import { useTranslation } from "@plane/i18n";
import { Icon } from "@makeplane/propel/components/icon";
import { IconButton } from "@makeplane/propel/components/icon-button";
import {
  Menu,
  MenuContent,
  MenuItem,
  MenuSubmenu,
  MenuSubmenuContent,
  MenuSubmenuTrigger,
  MenuTrigger,
} from "@makeplane/propel/components/menu";
import { MoreHorizontalOutline } from "@makeplane/propel/icons";
import { toSideAndAlign } from "@plane/blocks/common";
import { ContextMenu, getRenderableItems, resolveItemVariant } from "@plane/blocks/context-menu";
// hooks
import { useIssues } from "@/hooks/store/use-issues";
import { useUserPermissions } from "@/hooks/store/user";
// local imports
import { DeleteIssueModal } from "../../delete-issue-modal";
import type { IQuickActionProps } from "../list/list-view-types";
import type { MenuItemFactoryProps } from "./helper";
import { useArchivedIssueMenuItems, quickActionTriggerGuard, stopQuickActionPropagation } from "./helper";

export const ArchivedIssueQuickActions = observer(function ArchivedIssueQuickActions(props: IQuickActionProps) {
  const {
    issue,
    handleDelete,
    handleRestore,
    customActionButton,
    readOnly = false,
    placements = "bottom-end",
    parentRef,
  } = props;
  // states
  const [deleteIssueModal, setDeleteIssueModal] = useState(false);
  // router
  const { workspaceSlug } = useParams();
  const { t } = useTranslation();
  // store hooks
  const { allowPermissions } = useUserPermissions();

  const { issuesFilter } = useIssues(EIssuesStoreType.ARCHIVED);
  // derived values
  const activeLayout = `${issuesFilter.issueFilters?.displayFilters?.layout} layout`;
  // auth
  const isEditingAllowed =
    allowPermissions([EUserPermissions.ADMIN, EUserPermissions.MEMBER], EUserPermissionsLevel.PROJECT) && !readOnly;
  const isRestoringAllowed =
    handleRestore && allowPermissions([EUserPermissions.ADMIN, EUserPermissions.MEMBER], EUserPermissionsLevel.PROJECT);

  // Menu items and modals using helper
  const menuItemProps: MenuItemFactoryProps = {
    issue,
    workspaceSlug: workspaceSlug?.toString(),
    activeLayout,
    isEditingAllowed,
    isDeletingAllowed: isEditingAllowed,
    isRestoringAllowed: !!isRestoringAllowed,
    setIssueToEdit: () => {},
    setCreateUpdateIssueModal: () => {},
    setDeleteIssueModal,
    handleRestore,
    handleDelete,
  };

  const MENU_ITEMS = useArchivedIssueMenuItems(menuItemProps);

  const CONTEXT_MENU_ITEMS = MENU_ITEMS.map(function CONTEXT_MENU_ITEMS(item) {
    return {
      ...item,

      onClick: () => {
        item.action();
      },
    };
  });
  return (
    <>
      {/* Modals */}
      <DeleteIssueModal
        data={issue}
        isOpen={deleteIssueModal}
        handleClose={() => setDeleteIssueModal(false)}
        onSubmit={handleDelete}
      />

      <ContextMenu parentRef={parentRef} items={CONTEXT_MENU_ITEMS} />
      <Menu>
        <MenuTrigger
          {...quickActionTriggerGuard}
          render={
            customActionButton ?? (
              // Icon-only fallback trigger, so it needs an explicit accessible name.
              <IconButton
                variant="ghost"
                size="sm"
                aria-label={t("aria_labels.common.more_actions")}
                icon={<Icon icon={MoreHorizontalOutline} />}
              />
            )
          }
        />
        <MenuContent {...toSideAndAlign(placements)} onClick={stopQuickActionPropagation}>
          {getRenderableItems(MENU_ITEMS).map((item) => {
            const nestedItems = getRenderableItems(item.nestedMenuItems);
            if (nestedItems.length > 0) {
              return (
                <MenuSubmenu key={item.key}>
                  <MenuSubmenuTrigger
                    variant={resolveItemVariant(item)}
                    icon={item.icon ? <Icon icon={item.icon} /> : undefined}
                    label={item.title ?? ""}
                    disabled={item.disabled}
                  />
                  <MenuSubmenuContent sizing="auto">
                    {nestedItems.map((nestedItem) => (
                      <MenuItem
                        key={nestedItem.key}
                        variant={resolveItemVariant(nestedItem)}
                        icon={nestedItem.icon ? <Icon icon={nestedItem.icon} /> : undefined}
                        label={nestedItem.title ?? ""}
                        description={nestedItem.description}
                        onClick={() => {
                          nestedItem.action();
                        }}
                        disabled={nestedItem.disabled}
                      />
                    ))}
                  </MenuSubmenuContent>
                </MenuSubmenu>
              );
            }
            return (
              <MenuItem
                key={item.key}
                variant={resolveItemVariant(item)}
                icon={item.icon ? <Icon icon={item.icon} /> : undefined}
                label={item.title ?? ""}
                description={item.description}
                onClick={() => {
                  item.action();
                }}
                disabled={item.disabled}
              />
            );
          })}
        </MenuContent>
      </Menu>
    </>
  );
});
