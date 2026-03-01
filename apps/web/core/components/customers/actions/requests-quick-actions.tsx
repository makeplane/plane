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

import { observer } from "mobx-react";
import { LinkIcon, EditIcon, TrashIcon } from "@plane/propel/icons";
// plane imports
import { EUserPermissionsLevel } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { EUserWorkspaceRoles } from "@plane/types";
import type { TContextMenuItem } from "@plane/ui";
import { ContextMenu, CustomMenu } from "@plane/ui";
import { cn, copyUrlToClipboard } from "@plane/utils";
// plane web constants
import { useUserPermissions } from "@/hooks/store/user";
import { DeleteCustomerRequestsModal } from "@/components/customers/actions";
import { useCustomers } from "@/plane-web/hooks/store";

type Props = {
  customerId: string;
  requestId: string;
  parentRef: React.RefObject<HTMLDivElement> | null;
  handleEdit: () => void;
  workspaceSlug: string;
  workItemId?: string;
};

export const CustomerRequestQuickActions = observer(function CustomerRequestQuickActions(props: Props) {
  const { customerId, handleEdit, parentRef, requestId, workspaceSlug, workItemId } = props;
  // i18n
  const { t } = useTranslation();
  // hooks
  const { allowPermissions } = useUserPermissions();
  const { requestDeleteModalId, toggleDeleteRequestModal } = useCustomers();
  // derived values
  const isAdmin = allowPermissions([EUserWorkspaceRoles.ADMIN], EUserPermissionsLevel.WORKSPACE);

  const customerRequestLink = `${workspaceSlug}/customers/${customerId}?requestId=${requestId}`;

  const handleCopyLink = () =>
    copyUrlToClipboard(customerRequestLink).then(() => {
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("customers.requests.toasts.copy_link.title"),
        message: t("customers.requests.toasts.copy_link.message"),
      });
    });

  const MENU_ITEMS: TContextMenuItem[] = [
    {
      key: "edit",
      title: "Edit",
      icon: EditIcon,
      action: handleEdit,
      shouldRender: isAdmin,
    },
    {
      key: "copy-link",
      action: handleCopyLink,
      title: "Copy link",
      icon: LinkIcon,
      iconClassName: "-rotate-45",
    },
    {
      key: "delete",
      action: () => toggleDeleteRequestModal(requestId),
      title: "Delete",
      icon: TrashIcon,
      className: "text-danger-primary",
      shouldRender: isAdmin,
    },
  ];

  return (
    <>
      <DeleteCustomerRequestsModal
        customerId={customerId}
        requestId={requestId}
        isModalOpen={requestDeleteModalId === requestId}
        handleClose={() => toggleDeleteRequestModal(null)}
        workItemId={workItemId}
      />
      {parentRef && <ContextMenu parentRef={parentRef} items={MENU_ITEMS} />}
      <CustomMenu ellipsis placement="bottom-end" closeOnSelect>
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
