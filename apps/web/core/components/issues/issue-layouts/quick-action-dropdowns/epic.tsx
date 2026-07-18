/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useMemo, useState } from "react";
import { omit } from "lodash-es";
import { observer } from "mobx-react";
import { useTranslation } from "@plane/i18n";
import { useParams } from "next/navigation";
// plane imports
import { EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
import type { TIssue } from "@plane/types";
import { EIssuesStoreType } from "@plane/types";
import { ContextMenu, CustomMenu } from "@plane/ui";
import { cn } from "@plane/utils";
// hooks
import { useIssues } from "@/hooks/store/use-issues";
import { useProject } from "@/hooks/store/use-project";
import { useUserPermissions } from "@/hooks/store/user";
// plane-web imports
import { CreateUpdateEpicModal } from "@/plane-web/components/epics/epic-modal";
// local imports
import { DeleteIssueModal } from "../../delete-issue-modal";
import type { IQuickActionProps } from "../list/list-view-types";
import type { MenuItemFactoryProps } from "./helper";
import { useMenuItemFactory } from "./helper";

/**
 * Quick actions dropdown for the epics list.
 * Epics cannot be archived (no /epics/:id/archive/ route on the backend), so
 * unlike work items no Archive action is offered here. Edit/copy open the
 * epic modal instead of the work item modal.
 */
export const EpicQuickActions = observer(function EpicQuickActions(props: IQuickActionProps) {
  const {
    issue,
    handleDelete,
    handleUpdate,
    customActionButton,
    portalElement,
    readOnly = false,
    placements = "bottom-end",
    parentRef,
  } = props;
  const { t } = useTranslation();
  // router
  const { workspaceSlug } = useParams();
  // states
  const [createUpdateEpicModal, setCreateUpdateEpicModal] = useState(false);
  const [epicToEdit, setEpicToEdit] = useState<TIssue | undefined>(undefined);
  const [deleteEpicModal, setDeleteEpicModal] = useState(false);
  // store hooks
  const { allowPermissions } = useUserPermissions();
  const { issuesFilter } = useIssues(EIssuesStoreType.EPIC);
  const { getProjectIdentifierById } = useProject();
  // derived values
  const activeLayout = `${issuesFilter.issueFilters?.displayFilters?.layout} layout`;
  const projectIdentifier = getProjectIdentifierById(issue?.project_id);
  // auth
  const isEditingAllowed =
    allowPermissions(
      [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
      EUserPermissionsLevel.PROJECT,
      workspaceSlug?.toString(),
      issue.project_id ?? undefined
    ) && !readOnly;
  const isDeletingAllowed = isEditingAllowed;

  const duplicateEpicPayload = omit(
    {
      ...issue,
      name: `${issue.name} (copy)`,
      sourceIssueId: issue.id,
    },
    ["id"]
  );

  // Menu items using the shared factory — intentionally no archive item
  const menuItemProps: MenuItemFactoryProps = {
    issue,
    workspaceSlug: workspaceSlug?.toString(),
    projectIdentifier,
    activeLayout,
    isEditingAllowed,
    isArchivingAllowed: false,
    isDeletingAllowed,
    setIssueToEdit: setEpicToEdit,
    setCreateUpdateIssueModal: setCreateUpdateEpicModal,
    setDeleteIssueModal: setDeleteEpicModal,
    handleDelete,
    handleUpdate,
    storeType: EIssuesStoreType.EPIC,
  };

  const factory = useMenuItemFactory(menuItemProps);

  const MENU_ITEMS = useMemo(
    () => [
      factory.createEditMenuItem(),
      factory.createCopyMenuItem(),
      factory.createOpenInNewTabMenuItem(),
      factory.createCopyLinkMenuItem(),
      factory.createDeleteMenuItem(),
    ],
    [factory]
  );

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
        isOpen={deleteEpicModal}
        handleClose={() => setDeleteEpicModal(false)}
        onSubmit={handleDelete}
        isEpic
      />
      <CreateUpdateEpicModal
        isOpen={createUpdateEpicModal}
        onClose={() => {
          setCreateUpdateEpicModal(false);
          setEpicToEdit(undefined);
        }}
        data={epicToEdit ?? duplicateEpicPayload}
        onSubmit={async (data) => {
          if (epicToEdit && handleUpdate) await handleUpdate(data);
        }}
      />

      <ContextMenu parentRef={parentRef} items={CONTEXT_MENU_ITEMS} />
      <CustomMenu
        ariaLabel={t("aria_labels.quick_actions.epic")}
        ellipsis
        placement={placements}
        customButton={customActionButton}
        portalElement={portalElement}
        menuItemsClassName="z-[14]"
        maxHeight="lg"
        closeOnSelect
      >
        {MENU_ITEMS.map((item) => {
          if (item.shouldRender === false) return null;
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
                    className={cn("whitespace-pre-line text-tertiary", {
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
