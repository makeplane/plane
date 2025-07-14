"use client";

import { useState } from "react";
import pick from "lodash/pick";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane imports
import { EPIC_TRACKER_ELEMENTS, EUserPermissionsLevel } from "@plane/constants";
import { EIssuesStoreType, EUserProjectRoles, EIssueServiceType, TIssue } from "@plane/types";
import { ContextMenu, CustomMenu } from "@plane/ui";
// components
import { cn } from "@plane/utils";
import { DeleteIssueModal } from "@/components/issues";
// helpers
import { IQuickActionProps } from "@/components/issues/issue-layouts/list/list-view-types";
// hooks
import { MenuItemFactoryProps } from "@/components/issues/issue-layouts/quick-action-dropdowns/helper";
import { captureClick } from "@/helpers/event-tracker.helper";
import { useIssues, useProject, useUserPermissions } from "@/hooks/store";
// plane-web
import { CreateUpdateEpicModal } from "@/plane-web/components/epics/epic-modal";
import { DuplicateWorkItemModal } from "@/plane-web/components/issues/issue-layouts/quick-action-dropdowns";
// helper
import { useEpicMenuItems } from "./helper";

type TProjectEpicQuickActionProps = IQuickActionProps & {
  toggleEditEpicModal?: (value: boolean) => void;
  toggleDeleteEpicModal?: (value: boolean) => void;
  toggleDuplicateEpicModal?: (value: boolean) => void;
  isPeekMode?: boolean;
};

export const ProjectEpicQuickActions: React.FC<TProjectEpicQuickActionProps> = observer((props) => {
  const {
    issue,
    handleDelete,
    handleUpdate,
    readOnly = false,
    parentRef,
    toggleEditEpicModal,
    toggleDeleteEpicModal,
    toggleDuplicateEpicModal,
    isPeekMode = false,
    portalElement,
  } = props;
  // router
  const { workspaceSlug } = useParams();
  // states
  const [createUpdateIssueModal, setCreateUpdateIssueModal] = useState(false);
  const [issueToEdit, setIssueToEdit] = useState<TIssue | undefined>(undefined);
  const [deleteIssueModal, setDeleteIssueModal] = useState(false);
  const [duplicateWorkItemModal, setDuplicateWorkItemModal] = useState(false);
  // store hooks
  const { allowPermissions } = useUserPermissions();
  const { issuesFilter } = useIssues(EIssuesStoreType.PROJECT);
  const { getProjectIdentifierById } = useProject();
  // derived values
  const activeLayout = `${issuesFilter.issueFilters?.displayFilters?.layout} layout`;
  const projectIdentifier = getProjectIdentifierById(issue?.project_id);
  // auth
  const isEditingAllowed =
    allowPermissions(
      [EUserProjectRoles.ADMIN, EUserProjectRoles.MEMBER],
      EUserPermissionsLevel.PROJECT,
      workspaceSlug?.toString(),
      issue?.project_id ?? ""
    ) && !readOnly;
  const isDeletingAllowed = isEditingAllowed;

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

  const customDuplicateAction = () => {
    setDuplicateWorkItemModal(true);
    if (toggleDuplicateEpicModal) toggleDuplicateEpicModal(true);
  };

  // Menu items using helper
  const menuItemProps: MenuItemFactoryProps = {
    issue,
    workspaceSlug: workspaceSlug?.toString(),
    projectIdentifier,
    activeLayout,
    isEditingAllowed,
    isDeletingAllowed,
    setIssueToEdit,
    setCreateUpdateIssueModal: customEditAction,
    setDeleteIssueModal: customDeleteAction,
    setDuplicateWorkItemModal: customDuplicateAction,
    handleDelete,
    handleUpdate,
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
          shouldRender: isEditingAllowed && !isPeekMode,
        };
      }
      // Customize delete action for epic
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
                      captureClick({
                        elementName: EPIC_TRACKER_ELEMENTS.QUICK_ACTIONS,
                        context: {
                          activeLayout,
                        },
                      });
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
                captureClick({
                  elementName: EPIC_TRACKER_ELEMENTS.QUICK_ACTIONS,
                  context: {
                    activeLayout,
                  },
                });
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
