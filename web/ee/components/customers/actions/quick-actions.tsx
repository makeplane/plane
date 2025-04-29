"use client";

import { useState } from "react";
import { observer } from "mobx-react";
import { Link2, Pencil, Trash2 } from "lucide-react";
// plane imports
import { EUserPermissionsLevel, EUserWorkspaceRoles } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { ContextMenu, CustomMenu, TContextMenuItem, TOAST_TYPE, setToast } from "@plane/ui";
import { cn, copyUrlToClipboard } from "@plane/utils";
// hooks
import { useCommandPalette, useUserPermissions } from "@/hooks/store";
// plane web constants
import { DeleteCustomerModal } from "@/plane-web/components/customers/actions";

type Props = {
  customerId: string;
  workspaceSlug: string;
  parentRef: React.RefObject<HTMLDivElement> | null;
  customClassName?: string;
};

export const CustomerQuickActions: React.FC<Props> = observer((props) => {
  const { customerId, workspaceSlug, parentRef, customClassName } = props;
  // states
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  // i18n
  const { t } = useTranslation();
  // store hooks
  const { toggleCreateCustomerModal } = useCommandPalette();
  const { allowPermissions } = useUserPermissions();
  // derived values
  const customerLink = `${workspaceSlug}/customers/${customerId}`;
  const isAdmin = allowPermissions([EUserWorkspaceRoles.ADMIN], EUserPermissionsLevel.WORKSPACE);

  const handleEditCustomer = () => {
    toggleCreateCustomerModal({ isOpen: true, customerId });
  };

  const handleCopyText = () =>
    copyUrlToClipboard(customerLink).then(() => {
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("customers.toasts.copy_link.title"),
        message: t("customers.toasts.copy_link.message"),
      });
    });

  const handelDeleteCustomer = () => {
    setIsDeleteModalOpen(true);
  };

  const MENU_ITEMS: TContextMenuItem[] = [
    {
      key: "edit",
      title: t("customers.quick_actions.edit"),
      icon: Pencil,
      action: handleEditCustomer,
      shouldRender: isAdmin,
    },
    {
      key: "copy-link",
      action: handleCopyText,
      title: t("customers.quick_actions.copy_link"),
      icon: Link2,
      iconClassName: "-rotate-45",
    },
    {
      key: "delete",
      action: handelDeleteCustomer,
      title: t("customers.quick_actions.delete"),
      icon: Trash2,
      className: "text-red-500",
      shouldRender: isAdmin,
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
      <CustomMenu ellipsis placement="bottom-end" closeOnSelect buttonClassName={customClassName}>
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
