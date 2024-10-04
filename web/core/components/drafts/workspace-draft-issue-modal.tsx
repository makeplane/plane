"use client";

import { useState } from "react";
import omit from "lodash/omit";
import { observer } from "mobx-react";
// icons
import { Copy, Pencil, SquareStack, SquareStackIcon, Trash2 } from "lucide-react";
// types
import { TIssue } from "@plane/types";
// ui
import { ContextMenu, CustomMenu, TContextMenuItem } from "@plane/ui";
// components
import { CreateUpdateIssueModal, DeleteIssueModal } from "@/components/issues";
// constant
import { EIssuesStoreType } from "@/constants/issue";
// helpers
import { cn } from "@/helpers/common.helper";
// hooks
import { useEventTracker, useIssues, useUserPermissions } from "@/hooks/store";
import { EUserPermissions, EUserPermissionsLevel } from "@/plane-web/constants/user-permissions";
import { IQuickActionProps } from "../issues/issue-layouts/list/list-view-types";
// types

export const WorkspaceDraftIssueQuickActions: React.FC<IQuickActionProps> = observer((props) => {
  const {
    issue,
    handleDelete,
    handleUpdate,
    handleMoveToIssues,
    customActionButton,
    portalElement,
    readOnly = false,
    placements = "bottom-end",
    parentRef,
  } = props;
  // states
  const [createUpdateDraftModal, setCreateUpdateDraftModal] = useState(false);
  const [draftToEdit, setDraftToEdit] = useState<TIssue | undefined>(undefined);
  const [deleteDraftModal, setDeleteDraftModal] = useState(false);
  // store hooks
  const { allowPermissions } = useUserPermissions();
  const { setTrackElement } = useEventTracker();
  const { issuesFilter } = useIssues(EIssuesStoreType.WORKSPACE_DRAFT);
  // derived values
  const activeLayout = `${issuesFilter.issueFilters?.displayFilters?.layout} layout`;
  // const activeLayout = `list layout`
  // auth
  const isEditingAllowed = true;
  // allowPermissions([EUserPermissions.ADMIN, EUserPermissions.MEMBER], EUserPermissionsLevel.PROJECT) && !readOnly;
  const isDeletingAllowed = isEditingAllowed;

  const duplicateIssuePayload = omit(
    {
      ...issue,
      name: `${issue.name} (copy)`,
      is_draft: true,
    },
    ["id"]
  );

  const MENU_ITEMS: TContextMenuItem[] = [
    {
      key: "edit",
      title: "Edit",
      icon: Pencil,
      action: () => {
        setTrackElement(activeLayout);
        setDraftToEdit(issue);
        setCreateUpdateDraftModal(true);
      },
      shouldRender: isEditingAllowed,
    },
    {
      key: "make-a-copy",
      title: "Make a copy",
      icon: Copy,
      action: () => {
        setTrackElement(activeLayout);
        setCreateUpdateDraftModal(true);
      },
      shouldRender: isDeletingAllowed,
    },
    {
      key: "move-to-issues",
      title: "Move to issues",
      icon: SquareStackIcon,
      action: () => handleMoveToIssues && handleMoveToIssues(),
      shouldRender: isDeletingAllowed,
    },
    {
      key: "delete",
      title: "Delete",
      icon: Trash2,
      action: () => {
        setTrackElement(activeLayout);
        setDeleteDraftModal(true);
      },
      shouldRender: isDeletingAllowed,
    },
  ];

  // check if any of the menu items should render
  const shouldRenderQuickAction = MENU_ITEMS.some((item) => item.shouldRender);

  if (!shouldRenderQuickAction) return <></>;

  return (
    <>
      <DeleteIssueModal
        data={issue}
        isOpen={deleteDraftModal}
        handleClose={() => setDeleteDraftModal(false)}
        onSubmit={handleDelete}
      />
      <CreateUpdateIssueModal
        isOpen={createUpdateDraftModal}
        onClose={() => {
          setCreateUpdateDraftModal(false);
          setDraftToEdit(undefined);
        }}
        data={draftToEdit ?? duplicateIssuePayload}
        onSubmit={async (data) => {
          if (draftToEdit && handleUpdate) await handleUpdate(data);
        }}
        storeType={EIssuesStoreType.DRAFT}
        isDraft
      />
      <ContextMenu parentRef={parentRef} items={MENU_ITEMS} />
      <CustomMenu
        ellipsis
        customButton={customActionButton}
        portalElement={portalElement}
        placement={placements}
        menuItemsClassName="z-[14]"
        maxHeight="lg"
        useCaptureForOutsideClick
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
