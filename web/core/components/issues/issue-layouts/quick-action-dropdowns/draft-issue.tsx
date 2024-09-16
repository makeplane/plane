"use client";

import { useState } from "react";
import omit from "lodash/omit";
import { observer } from "mobx-react";
// icons
import { Pencil, Trash2 } from "lucide-react";
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
// types
import { IQuickActionProps } from "../list/list-view-types";

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
  // states
  const [createUpdateIssueModal, setCreateUpdateIssueModal] = useState(false);
  const [issueToEdit, setIssueToEdit] = useState<TIssue | undefined>(undefined);
  const [deleteIssueModal, setDeleteIssueModal] = useState(false);
  // store hooks
  const { allowPermissions } = useUserPermissions();
  const { setTrackElement } = useEventTracker();
  const { issuesFilter } = useIssues(EIssuesStoreType.PROJECT);
  // derived values
  const activeLayout = `${issuesFilter.issueFilters?.displayFilters?.layout} layout`;
  // auth
  const isEditingAllowed =
    allowPermissions([EUserPermissions.ADMIN, EUserPermissions.MEMBER], EUserPermissionsLevel.PROJECT) && !readOnly;
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
        setIssueToEdit(issue);
        setCreateUpdateIssueModal(true);
      },
      shouldRender: isEditingAllowed,
    },
    {
      key: "delete",
      title: "Delete",
      icon: Trash2,
      action: () => {
        setTrackElement(activeLayout);
        setDeleteIssueModal(true);
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
