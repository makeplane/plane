"use client";

import { useState } from "react";
import omit from "lodash/omit";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane imports
import {
  ARCHIVABLE_STATE_GROUPS,
  EUserPermissions,
  EUserPermissionsLevel,
  WORK_ITEM_TRACKER_ELEMENTS,
} from "@plane/constants";
import { EIssuesStoreType, TIssue } from "@plane/types";
import { ContextMenu, CustomMenu, TContextMenuItem } from "@plane/ui";
import { cn } from "@plane/utils";
// components
import { ArchiveIssueModal, CreateUpdateIssueModal, DeleteIssueModal } from "@/components/issues";
// hooks
import { captureClick } from "@/helpers/event-tracker.helper";
import { useIssues, useProjectState, useUserPermissions, useProject } from "@/hooks/store";
// plane-web components
import { DuplicateWorkItemModal } from "@/plane-web/components/issues/issue-layouts/quick-action-dropdowns";
import { IQuickActionProps } from "../list/list-view-types";
// helper
import { useModuleIssueMenuItems, MenuItemFactoryProps } from "./helper";

export const ModuleIssueQuickActions: React.FC<IQuickActionProps> = observer((props) => {
  const {
    issue,
    handleDelete,
    handleUpdate,
    handleRemoveFromView,
    handleArchive,
    customActionButton,
    portalElement,
    readOnly = false,
    placements = "bottom-start",
    parentRef,
  } = props;
  // states
  const [createUpdateIssueModal, setCreateUpdateIssueModal] = useState(false);
  const [issueToEdit, setIssueToEdit] = useState<TIssue | undefined>(undefined);
  const [deleteIssueModal, setDeleteIssueModal] = useState(false);
  const [archiveIssueModal, setArchiveIssueModal] = useState(false);
  const [duplicateWorkItemModal, setDuplicateWorkItemModal] = useState(false);
  // router
  const { workspaceSlug, moduleId } = useParams();
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

  const CONTEXT_MENU_ITEMS: TContextMenuItem[] = MENU_ITEMS.map((item) => ({
    ...item,
    onClick: () => {
      captureClick({ elementName: WORK_ITEM_TRACKER_ELEMENTS.QUICK_ACTIONS.MODULE });
      item.action();
    },
  }));
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
        isDraft={false}
      />
      {issue.project_id && workspaceSlug && (
        <DuplicateWorkItemModal
          workItemId={issue.id}
          isOpen={duplicateWorkItemModal}
          onClose={() => setDuplicateWorkItemModal(false)}
          workspaceSlug={workspaceSlug.toString()}
          projectId={issue.project_id}
        />
      )}

      <ContextMenu parentRef={parentRef} items={CONTEXT_MENU_ITEMS} />
      <CustomMenu
        ellipsis
        placement={placements}
        customButton={customActionButton}
        portalElement={portalElement}
        menuItemsClassName="z-[14]"
        maxHeight="lg"
        useCaptureForOutsideClick
        closeOnSelect
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
                        className={cn("text-custom-text-300 whitespace-pre-line", {
                          "text-custom-text-400": item.disabled,
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
                    "text-custom-text-400": item.disabled,
                  },
                  item.className
                )}
              >
                {item.nestedMenuItems.map((nestedItem) => (
                  <CustomMenu.MenuItem
                    key={nestedItem.key}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      captureClick({ elementName: WORK_ITEM_TRACKER_ELEMENTS.QUICK_ACTIONS.MODULE });
                      nestedItem.action();
                    }}
                    className={cn(
                      "flex items-center gap-2",
                      {
                        "text-custom-text-400": nestedItem.disabled,
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
                          className={cn("text-custom-text-300 whitespace-pre-line", {
                            "text-custom-text-400": nestedItem.disabled,
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
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                captureClick({ elementName: WORK_ITEM_TRACKER_ELEMENTS.QUICK_ACTIONS.MODULE });
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
