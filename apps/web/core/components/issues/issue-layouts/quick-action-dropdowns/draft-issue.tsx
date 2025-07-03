"use client";

import { useState } from "react";
import omit from "lodash/omit";
import { observer } from "mobx-react";
import { useParams, usePathname } from "next/navigation";
// plane imports
import { EUserPermissions, EUserPermissionsLevel, WORK_ITEM_TRACKER_ELEMENTS } from "@plane/constants";
import { EIssuesStoreType, TIssue } from "@plane/types";
import { ContextMenu, CustomMenu, TContextMenuItem } from "@plane/ui";
import { cn } from "@plane/utils";
// components
import { CreateUpdateIssueModal, DeleteIssueModal } from "@/components/issues";
// hooks
import { captureClick } from "@/helpers/event-tracker.helper";
import { useUserPermissions } from "@/hooks/store";
// local imports
import { IQuickActionProps } from "../list/list-view-types";
import { useDraftIssueMenuItems, MenuItemFactoryProps } from "./helper";

export const DraftIssueQuickActions: React.FC<IQuickActionProps> = observer((props) => {
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
  // router
  const { workspaceSlug } = useParams();
  const pathname = usePathname();
  // states
  const [createUpdateIssueModal, setCreateUpdateIssueModal] = useState(false);
  const [issueToEdit, setIssueToEdit] = useState<TIssue | undefined>(undefined);
  const [deleteIssueModal, setDeleteIssueModal] = useState(false);
  // store hooks
  const { allowPermissions } = useUserPermissions();
  // derived values
  const activeLayout = "Draft Issues";
  // auth
  const isEditingAllowed =
    allowPermissions(
      [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
      EUserPermissionsLevel.PROJECT,
      workspaceSlug?.toString(),
      issue.project_id ?? undefined
    ) && !readOnly;
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

  // Menu items and modals using helper
  const menuItemProps: MenuItemFactoryProps = {
    issue,
    workspaceSlug: workspaceSlug?.toString(),
    activeLayout,
    isEditingAllowed,
    isDeletingAllowed,
    isDraftIssue,
    setIssueToEdit,
    setCreateUpdateIssueModal,
    setDeleteIssueModal,
    handleDelete,
    handleUpdate,
    storeType: EIssuesStoreType.DRAFT,
  };

  const MENU_ITEMS = useDraftIssueMenuItems(menuItemProps);

  const CONTEXT_MENU_ITEMS: TContextMenuItem[] = MENU_ITEMS.map((item) => ({
    ...item,
    onClick: () => {
      captureClick({ elementName: WORK_ITEM_TRACKER_ELEMENTS.QUICK_ACTIONS.DRAFT });
      item.action();
    },
  }));

  return (
    <>
      {/* Modals */}
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
        storeType={EIssuesStoreType.DRAFT}
        isDraft={isDraftIssue}
      />

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
          return (
            <CustomMenu.MenuItem
              key={item.key}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                captureClick({ elementName: WORK_ITEM_TRACKER_ELEMENTS.QUICK_ACTIONS.DRAFT });
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
