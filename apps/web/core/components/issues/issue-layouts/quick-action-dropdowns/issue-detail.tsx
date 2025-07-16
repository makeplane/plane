"use client";

import { useState } from "react";
import omit from "lodash/omit";
import { observer } from "mobx-react";
import { useParams, usePathname } from "next/navigation";
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
import { useIssues, useProject, useProjectState, useUserPermissions } from "@/hooks/store";
// plane-web components
import { DuplicateWorkItemModal } from "@/plane-web/components/issues/issue-layouts/quick-action-dropdowns";
import { IQuickActionProps } from "../list/list-view-types";
// helper
import { MenuItemFactoryProps, useWorkItemDetailMenuItems } from "./helper";

type TWorkItemDetailQuickActionProps = IQuickActionProps & {
  toggleEditIssueModal?: (value: boolean) => void;
  toggleDeleteIssueModal?: (value: boolean) => void;
  toggleDuplicateIssueModal?: (value: boolean) => void;
  toggleArchiveIssueModal?: (value: boolean) => void;
  isPeekMode?: boolean;
};

export const WorkItemDetailQuickActions: React.FC<TWorkItemDetailQuickActionProps> = observer((props) => {
  const {
    issue,
    handleDelete,
    handleUpdate,
    handleArchive,
    handleRestore,
    customActionButton,
    portalElement,
    readOnly = false,
    placements = "bottom-end",
    parentRef,
    toggleEditIssueModal,
    toggleDeleteIssueModal,
    toggleDuplicateIssueModal,
    toggleArchiveIssueModal,
    isPeekMode = false,
  } = props;
  // router
  const { workspaceSlug } = useParams();
  const pathname = usePathname();
  // states
  const [createUpdateIssueModal, setCreateUpdateIssueModal] = useState(false);
  const [issueToEdit, setIssueToEdit] = useState<TIssue | undefined>(undefined);
  const [deleteIssueModal, setDeleteIssueModal] = useState(false);
  const [archiveIssueModal, setArchiveIssueModal] = useState(false);
  const [duplicateWorkItemModal, setDuplicateWorkItemModal] = useState(false);
  // store hooks
  const { allowPermissions } = useUserPermissions();
  const { issuesFilter } = useIssues(EIssuesStoreType.PROJECT);
  const { getStateById } = useProjectState();
  const { getProjectIdentifierById } = useProject();
  // derived values
  const activeLayout = `${issuesFilter.issueFilters?.displayFilters?.layout} layout`;
  const stateDetails = getStateById(issue.state_id);
  const projectIdentifier = getProjectIdentifierById(issue?.project_id);
  // auth
  const isEditingAllowed =
    allowPermissions(
      [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
      EUserPermissionsLevel.PROJECT,
      workspaceSlug?.toString(),
      issue.project_id ?? undefined
    ) && !readOnly;

  const isArchivingAllowed = !issue.archived_at && isEditingAllowed;
  const isInArchivableGroup = !!stateDetails && ARCHIVABLE_STATE_GROUPS.includes(stateDetails?.group);
  const isRestoringAllowed = !!issue.archived_at && isEditingAllowed;

  const isDeletingAllowed = isEditingAllowed;

  const isDraftIssue = pathname?.includes("draft-issues") || false;

  const duplicateIssuePayload = omit(
    {
      ...issue,
      name: `${issue.name} (copy)`,
      is_draft: isDraftIssue ? false : issue.is_draft,
      sourceIssueId: issue.id,
    },
    ["id"]
  );

  const customEditAction = () => {
    setCreateUpdateIssueModal(true);
    if (toggleEditIssueModal) toggleEditIssueModal(true);
  };

  const customDeleteAction = async () => {
    setDeleteIssueModal(true);
    if (toggleDeleteIssueModal) toggleDeleteIssueModal(true);
  };

  const customDuplicateAction = async () => {
    setDuplicateWorkItemModal(true);
    if (toggleDuplicateIssueModal) {
      toggleDuplicateIssueModal(true);
    }
  };

  const customArchiveAction = async () => {
    setArchiveIssueModal(true);
    if (toggleArchiveIssueModal) toggleArchiveIssueModal(true);
  };

  const customRestoreAction = async () => {
    if (handleRestore) await handleRestore();
  };

  // Menu items and modals using helper
  const menuItemProps: MenuItemFactoryProps = {
    issue,
    workspaceSlug: workspaceSlug?.toString(),
    projectIdentifier,
    activeLayout,
    isEditingAllowed,
    isArchivingAllowed,
    isRestoringAllowed,
    isDeletingAllowed,
    isInArchivableGroup,
    isDraftIssue,
    setIssueToEdit,
    setCreateUpdateIssueModal: customEditAction,
    setDeleteIssueModal: customDeleteAction,
    setArchiveIssueModal: customArchiveAction,
    setDuplicateWorkItemModal: customDuplicateAction,
    handleDelete: customDeleteAction,
    handleUpdate,
    handleArchive: customArchiveAction,
    handleRestore: customRestoreAction,
    storeType: EIssuesStoreType.PROJECT,
  };

  //   const MENU_ITEMS = useWorkItemDetailMenuItems(menuItemProps);
  const baseMenuItems = useWorkItemDetailMenuItems(menuItemProps);

  const MENU_ITEMS = baseMenuItems
    .map((item) => {
      // Customize edit action for work item
      if (item.key === "edit") {
        return {
          ...item,
          shouldRender: isEditingAllowed && !isPeekMode,
        };
      }
      // Customize delete action for work item
      if (item.key === "delete") {
        return {
          ...item,
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

  const CONTEXT_MENU_ITEMS: TContextMenuItem[] = MENU_ITEMS.map((item) => ({
    ...item,
    onClick: () => {
      captureClick({ elementName: WORK_ITEM_TRACKER_ELEMENTS.QUICK_ACTIONS.PROJECT_VIEW });
      item.action();
    },
  }));

  return (
    <>
      {/* Modals */}
      <ArchiveIssueModal
        data={issue}
        isOpen={archiveIssueModal}
        handleClose={() => {
          setArchiveIssueModal(false);
          if (toggleArchiveIssueModal) toggleArchiveIssueModal(false);
        }}
        onSubmit={handleArchive}
      />
      <DeleteIssueModal
        data={issue}
        isOpen={deleteIssueModal}
        handleClose={() => {
          setDeleteIssueModal(false);
          if (toggleDeleteIssueModal) toggleDeleteIssueModal(false);
        }}
        onSubmit={handleDelete}
      />
      <CreateUpdateIssueModal
        isOpen={createUpdateIssueModal}
        onClose={() => {
          setCreateUpdateIssueModal(false);
          setIssueToEdit(undefined);
          if (toggleEditIssueModal) toggleEditIssueModal(false);
        }}
        data={issueToEdit ?? duplicateIssuePayload}
        onSubmit={async (data) => {
          if (issueToEdit && handleUpdate) await handleUpdate(data);
        }}
        storeType={EIssuesStoreType.PROJECT}
        isDraft={isDraftIssue}
        fetchIssueDetails={false}
      />
      {issue.project_id && workspaceSlug && (
        <DuplicateWorkItemModal
          workItemId={issue.id}
          isOpen={duplicateWorkItemModal}
          onClose={() => {
            setDuplicateWorkItemModal(false);
            if (toggleDuplicateIssueModal) toggleDuplicateIssueModal(false);
          }}
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
                      captureClick({ elementName: WORK_ITEM_TRACKER_ELEMENTS.QUICK_ACTIONS.PROJECT_VIEW });
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
                captureClick({ elementName: WORK_ITEM_TRACKER_ELEMENTS.QUICK_ACTIONS.PROJECT_VIEW });
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
