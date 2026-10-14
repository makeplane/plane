/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { omit } from "lodash-es";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane imports
import { ARCHIVABLE_STATE_GROUPS, EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
import type { TIssue } from "@plane/types";
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
import { useProject } from "@/hooks/store/use-project";
import { useProjectState } from "@/hooks/store/use-project-state";
import { useUserPermissions } from "@/hooks/store/user";
// helper
import { ArchiveIssueModal } from "../../archive-issue-modal";
import { DeleteIssueModal } from "../../delete-issue-modal";
import { CreateUpdateIssueModal } from "../../issue-modal/modal";
import type { IQuickActionProps } from "../list/list-view-types";
import type { MenuItemFactoryProps } from "./helper";
import {
  useModuleIssueMenuItems,
  quickActionTriggerGuard,
  isNativeQuickActionTrigger,
  stopQuickActionPropagation,
} from "./helper";

export const ModuleIssueQuickActions = observer(function ModuleIssueQuickActions(props: IQuickActionProps) {
  const {
    issue,
    handleDelete,
    handleUpdate,
    handleRemoveFromView,
    handleArchive,
    customActionButton,
    readOnly = false,
    placements = "bottom-start",
    parentRef,
  } = props;
  // states
  const [createUpdateIssueModal, setCreateUpdateIssueModal] = useState(false);
  const [issueToEdit, setIssueToEdit] = useState<TIssue | undefined>(undefined);
  const [deleteIssueModal, setDeleteIssueModal] = useState(false);
  const [archiveIssueModal, setArchiveIssueModal] = useState(false);
  const [_, setDuplicateWorkItemModal] = useState(false);
  // router
  const { workspaceSlug, moduleId } = useParams();
  const { t } = useTranslation();
  // store hooks
  const { issuesFilter } = useIssues(EIssuesStoreType.MODULE);
  const { allowPermissions } = useUserPermissions();
  const { getStateById } = useProjectState();
  const { getProjectIdentifierById } = useProject();
  // derived values
  const stateDetails = getStateById(issue.state_id);
  const projectIdentifier = getProjectIdentifierById(issue?.project_id);
  // auth
  const isEditingAllowed =
    allowPermissions([EUserPermissions.ADMIN, EUserPermissions.MEMBER], EUserPermissionsLevel.PROJECT) && !readOnly;
  const isArchivingAllowed = handleArchive && isEditingAllowed;
  const isInArchivableGroup = !!stateDetails && ARCHIVABLE_STATE_GROUPS.includes(stateDetails?.group);
  const isDeletingAllowed = isEditingAllowed;

  const activeLayout = `${issuesFilter.issueFilters?.displayFilters?.layout} layout`;

  const duplicateIssuePayload = omit(
    {
      ...issue,
      name: `${issue.name} (copy)`,
      sourceIssueId: issue.id,
    },
    ["id"]
  );

  // Menu items and modals using helper
  const menuItemProps: MenuItemFactoryProps = {
    issue,
    workspaceSlug: workspaceSlug?.toString(),
    projectIdentifier,
    activeLayout,
    isEditingAllowed,
    isArchivingAllowed,
    isDeletingAllowed,
    isInArchivableGroup,
    setIssueToEdit,
    setCreateUpdateIssueModal,
    setDeleteIssueModal,
    setArchiveIssueModal,
    setDuplicateWorkItemModal,
    handleRemoveFromView,
    moduleId: moduleId?.toString(),
    handleDelete,
    handleUpdate,
    handleArchive,
    storeType: EIssuesStoreType.MODULE,
  };

  const MENU_ITEMS = useModuleIssueMenuItems(menuItemProps);

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
      <ArchiveIssueModal
        data={issue}
        isOpen={archiveIssueModal}
        handleClose={() => setArchiveIssueModal(false)}
        onSubmit={handleArchive}
      />
      <DeleteIssueModal
        data={issue}
        isOpen={deleteIssueModal}
        handleClose={() => setDeleteIssueModal(false)}
        onSubmit={handleDelete}
      />
      <CreateUpdateIssueModal
        isOpen={createUpdateIssueModal}
        onClose={() => {
          setCreateUpdateIssueModal(false);
          setIssueToEdit(undefined);
        }}
        data={issueToEdit ?? duplicateIssuePayload}
        onSubmit={async (data) => {
          if (issueToEdit && handleUpdate) await handleUpdate(data);
        }}
        storeType={EIssuesStoreType.MODULE}
      />

      <ContextMenu parentRef={parentRef} items={CONTEXT_MENU_ITEMS} />
      <Menu>
        <MenuTrigger
          {...quickActionTriggerGuard}
          nativeButton={isNativeQuickActionTrigger(customActionButton)}
          aria-label={t("aria_labels.common.more_actions")}
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
