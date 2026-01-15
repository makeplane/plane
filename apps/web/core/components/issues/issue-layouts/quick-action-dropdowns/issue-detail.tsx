import { useState } from "react";
import { omit } from "lodash-es";
import { observer } from "mobx-react";
import { useParams, usePathname } from "next/navigation";
import { Ellipsis } from "lucide-react";
// plane imports
import { ARCHIVABLE_STATE_GROUPS, EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
import type { TIssue } from "@plane/types";
import { EIssuesStoreType } from "@plane/types";
import { ContextMenu, CustomMenu } from "@plane/ui";
import { cn } from "@plane/utils";
// hooks
import { useIssues } from "@/hooks/store/use-issues";
import { useProject } from "@/hooks/store/use-project";
import { useProjectState } from "@/hooks/store/use-project-state";
import { useUserPermissions } from "@/hooks/store/user";
// plane-web components
import { DuplicateWorkItemModal } from "@/plane-web/components/issues/issue-layouts/quick-action-dropdowns/duplicate-modal";
// helper
import { ArchiveIssueModal } from "../../archive-issue-modal";
import { DeleteIssueModal } from "../../delete-issue-modal";
import { CreateUpdateIssueModal } from "../../issue-modal/modal";
import type { IQuickActionProps } from "../list/list-view-types";
import type { MenuItemFactoryProps } from "./helper";
import { useWorkItemDetailMenuItems } from "./helper";
import { IconButton } from "@plane/propel/icon-button";

type TWorkItemDetailQuickActionProps = IQuickActionProps & {
  toggleEditIssueModal?: (value: boolean) => void;
  toggleDeleteIssueModal?: (value: boolean) => void;
  toggleDuplicateIssueModal?: (value: boolean) => void;
  toggleArchiveIssueModal?: (value: boolean) => void;
  isPeekMode?: boolean;
};

export const WorkItemDetailQuickActions = observer(function WorkItemDetailQuickActions(
  props: TWorkItemDetailQuickActionProps
) {
  const {
    issue,
    handleDelete,
    handleUpdate,
    handleArchive,
    handleRestore,
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

  const duplicateIssuePayload = omit(
    {
      ...issue,
      name: `${issue.name} (copy)`,
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
    .filter(function MENU_ITEMS(item) {
      return item.shouldRender !== false;
    });

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
        customButton={<IconButton size="lg" variant="secondary" icon={Ellipsis} />}
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
