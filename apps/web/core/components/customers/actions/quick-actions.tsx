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
import { observer } from "mobx-react";
import { MoreHorizontal } from "lucide-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { IconButton } from "@plane/propel/icon-button";
import { LinkIcon, EditIcon, TrashIcon } from "@plane/propel/icons";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { TContextMenuItem } from "@plane/ui";
import { ContextMenu, CustomMenu } from "@plane/ui";
import { cn, copyUrlToClipboard } from "@plane/utils";
// hooks
import { useCommandPalette } from "@/hooks/store/use-command-palette";
// plane web constants
import { DeleteCustomerModal } from "@/components/customers/actions";

type Props = {
  customerId: string;
  workspaceSlug: string;
  parentRef: React.RefObject<HTMLDivElement> | null;
  customClassName?: string;
  permissions: {
    canEdit: boolean;
    canDelete: boolean;
  };
};

export const CustomerQuickActions = observer(function CustomerQuickActions(props: Props) {
  const { customerId, workspaceSlug, parentRef, customClassName, permissions } = props;
  // states
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  // i18n
  const { t } = useTranslation();
  // store hooks
  const { toggleCreateCustomerModal } = useCommandPalette();
  // derived values
  const customerLink = `${workspaceSlug}/customers/${customerId}`;
  const { canEdit, canDelete } = permissions;

  const handleEditCustomer = () => {
    toggleCreateCustomerModal({ isOpen: true, customerId });
  };

  const handleCopyText = async () => {
    try {
      await copyUrlToClipboard(customerLink);

      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("customers.toasts.copy_link.title"),
        message: t("customers.toasts.copy_link.message"),
      });
    } catch (_error) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("toast.error"),
        message: t("common.link_copy_failed"),
      });
    }
  };

  const handelDeleteCustomer = () => {
    setIsDeleteModalOpen(true);
  };

  const MENU_ITEMS: TContextMenuItem[] = [
    {
      key: "edit",
      title: t("customers.quick_actions.edit"),
      icon: EditIcon,
      action: handleEditCustomer,
      shouldRender: canEdit,
    },
    {
      key: "copy-link",
      action: handleCopyText,
      title: t("customers.quick_actions.copy_link"),
      icon: LinkIcon,
      iconClassName: "",
    },
    {
      key: "delete",
      action: handelDeleteCustomer,
      title: t("customers.quick_actions.delete"),
      icon: TrashIcon,
      className: "text-danger-primary",
      shouldRender: canDelete,
    },
  ];

  return (
    <>
      <DeleteCustomerModal
        customerId={customerId}
        isModalOpen={isDeleteModalOpen}
        handleClose={() => setIsDeleteModalOpen(false)}
      />
      {parentRef && <ContextMenu parentRef={parentRef} items={MENU_ITEMS} />}
      <CustomMenu
        customButton={<IconButton variant="tertiary" size="lg" icon={MoreHorizontal} />}
        placement="bottom-end"
        closeOnSelect
        buttonClassName={customClassName}
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
