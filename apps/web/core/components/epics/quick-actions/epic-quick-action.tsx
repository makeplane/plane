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
import { pick } from "lodash-es";
import { observer } from "mobx-react";
import { Ellipsis } from "lucide-react";
import { useParams } from "next/navigation";
// plane imports
import { ARCHIVABLE_STATE_GROUPS } from "@plane/constants";
import type { TIssue } from "@plane/types";
import { EIssuesStoreType, EIssueServiceType } from "@plane/types";
import { ContextMenu, CustomMenu } from "@plane/ui";
// components
import { cn } from "@plane/utils";
import { DeleteIssueModal } from "@/components/issues/delete-issue-modal";
import { ArchiveIssueModal } from "@/components/issues/archive-issue-modal";
// helpers
import type { IQuickActionProps } from "@/components/issues/issue-layouts/list/list-view-types";
// hooks
import type { MenuItemFactoryProps } from "@/components/issues/issue-layouts/quick-action-dropdowns/helper";
import { useIssues } from "@/hooks/store/use-issues";
import { useProject } from "@/hooks/store/use-project";
import { useProjectState } from "@/hooks/store/use-project-state";
// plane-web
import { CreateUpdateEpicModal } from "@/components/epics/epic-modal";
import { DuplicateWorkItemModal } from "@/components/issues/duplicate-modal";
// helper
import { useEpicMenuItems } from "./helper";
import { IconButton } from "@plane/propel/icon-button";

type TProjectEpicQuickActionProps = Exclude<IQuickActionProps, "readOnly" | "disabled"> & {
  toggleEditEpicModal?: (value: boolean) => void;
  toggleDeleteEpicModal?: (value: boolean) => void;
  toggleArchiveEpicModal?: (value: boolean) => void;
  toggleDuplicateEpicModal?: (value: boolean) => void;
  isPeekMode?: boolean;
  workItemId?: string;
  permissions: {
    canEdit: boolean;
    canDelete: boolean;
    canArchive: boolean;
    canRestore: boolean;
    canDuplicate: boolean;
  };
};

export const ProjectEpicQuickActions = observer(function ProjectEpicQuickActions(props: TProjectEpicQuickActionProps) {
  const {
    issue,
    handleDelete,
    handleUpdate,
    handleArchive,
    handleRestore,
    parentRef,
    toggleEditEpicModal,
    toggleDeleteEpicModal,
    toggleArchiveEpicModal,
    toggleDuplicateEpicModal,
    isPeekMode = false,
    portalElement,
    workItemId,
    permissions,
  } = props;
  // router
  const { workspaceSlug } = useParams();
  // states
  const [createUpdateIssueModal, setCreateUpdateIssueModal] = useState(false);
  const [issueToEdit, setIssueToEdit] = useState<TIssue | undefined>(undefined);
  const [deleteIssueModal, setDeleteIssueModal] = useState(false);
  const [archiveIssueModal, setArchiveIssueModal] = useState(false);
  const [duplicateWorkItemModal, setDuplicateWorkItemModal] = useState(false);
  // store hooks
  const { issuesFilter } = useIssues(EIssuesStoreType.PROJECT);
  const { getStateById } = useProjectState();
  const { getProjectIdentifierById } = useProject();
  // derived values
  const activeLayout = `${issuesFilter.issueFilters?.displayFilters?.layout} layout`;
  const stateDetails = getStateById(issue.state_id);
  const projectIdentifier = getProjectIdentifierById(issue?.project_id);
  const { canEdit, canDelete, canArchive, canRestore, canDuplicate } = permissions;
  // auth
  const isInArchivableGroup = !!stateDetails && ARCHIVABLE_STATE_GROUPS.includes(stateDetails?.group);

  const duplicateEpicPayload = pick(
    {
      ...issue,
      name: `${issue.name} (copy)`,
      sourceIssueId: issue.id,
    },
    [
      "project_id",
      "type_id",
      "name",
      "description_html",
      "estimate_point",
      "state_id",
      "priority",
      "assignee_ids",
      "label_ids",
      "start_date",
      "target_date",
    ]
  );

  const customEditAction = () => {
    setCreateUpdateIssueModal(true);
    if (toggleEditEpicModal) toggleEditEpicModal(true);
  };

  const customDeleteAction = async () => {
    setDeleteIssueModal(true);
    if (toggleDeleteEpicModal) toggleDeleteEpicModal(true);
  };

  const customArchiveAction = async () => {
    setArchiveIssueModal(true);
    if (toggleArchiveEpicModal) toggleArchiveEpicModal(true);
  };

  const customDuplicateAction = () => {
    setDuplicateWorkItemModal(true);
    if (toggleDuplicateEpicModal) toggleDuplicateEpicModal(true);
  };

  const customRestoreAction = async () => {
    if (handleRestore) await handleRestore();
  };

  // Menu items using helper
  const menuItemProps: MenuItemFactoryProps = {
    issue,
    workspaceSlug: workspaceSlug?.toString(),
    projectIdentifier,
    activeLayout,
    canEdit,
    canArchive,
    canRestore: canRestore && !!handleRestore,
    canDelete,
    canDuplicate,
    isInArchivableGroup,
    setIssueToEdit,
    setCreateUpdateIssueModal: customEditAction,
    setDeleteIssueModal: customDeleteAction,
    setArchiveIssueModal: customArchiveAction,
    setDuplicateWorkItemModal: customDuplicateAction,
    handleDelete,
    handleUpdate,
    handleRestore: customRestoreAction,
    storeType: EIssuesStoreType.PROJECT,
  };

  const baseMenuItems = useEpicMenuItems(menuItemProps);

  // Filter out items based on peek mode and customize actions
  const MENU_ITEMS = baseMenuItems
    .map((item) => {
      // Customize edit action for epic
      if (item.key === "edit") {
        return {
          ...item,
          shouldRender: canEdit && !isPeekMode && !workItemId,
        };
      }
      // Customize delete action for epic
      if (item.key === "delete") {
        return {
          ...item,
          shouldRender: canDelete,
        };
      }
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
      <ArchiveIssueModal
        data={issue}
        isOpen={archiveIssueModal}
        handleClose={() => {
          setArchiveIssueModal(false);
          if (toggleArchiveEpicModal) toggleArchiveEpicModal(false);
        }}
        onSubmit={handleArchive}
        isEpic
      />
      <CreateUpdateEpicModal
        isOpen={createUpdateIssueModal}
        onClose={() => {
          setCreateUpdateIssueModal(false);
          setIssueToEdit(undefined);
          if (toggleEditEpicModal) toggleEditEpicModal(false);
        }}
        data={issueToEdit ?? duplicateEpicPayload}
        onSubmit={async (data) => {
          if (issueToEdit && handleUpdate) await handleUpdate(data);
        }}
      />
      {issue.project_id && workspaceSlug && (
        <DuplicateWorkItemModal
          workItemId={issue.id}
          isOpen={duplicateWorkItemModal}
          onClose={() => setDuplicateWorkItemModal(false)}
          workspaceSlug={workspaceSlug.toString()}
          projectId={issue.project_id}
          serviceType={EIssueServiceType.EPICS}
        />
      )}

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
