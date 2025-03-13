"use client";

import { useState } from "react";
import { observer } from "mobx-react";
// icons
import { Link2, Pencil, Trash2 } from "lucide-react";
// ui
import { EUserPermissionsLevel, EUserWorkspaceRoles } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { ContextMenu, CustomMenu, TContextMenuItem, TOAST_TYPE, setToast } from "@plane/ui";
// helpers
import { cn } from "@/helpers/common.helper";
import { copyUrlToClipboard } from "@/helpers/string.helper";
// plane web constants
import { useUserPermissions } from "@/hooks/store";
import { DeleteCustomerRequestsModal } from "@/plane-web/components/customers/actions";

type Props = {
  customerId: string;
  requestId: string;
  parentRef: React.RefObject<HTMLDivElement> | null;
  handleEdit: () => void;
  workspaceSlug: string;
};

export const CustomerRequestQuickActions: React.FC<Props> = observer((props) => {
  const { customerId, handleEdit, parentRef, requestId, workspaceSlug } = props;
  // states
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  // i18n
  const { t } = useTranslation();
  // hooks
  const { allowPermissions } = useUserPermissions();
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
      icon: Pencil,
      action: handleEdit,
      shouldRender: isAdmin,
    },
    {
      key: "copy-link",
      action: handleCopyLink,
      title: "Copy link",
      icon: Link2,
      iconClassName: "-rotate-45",
    },
    {
      key: "delete",
      action: () => setIsDeleteModalOpen(true),
      title: "Delete",
      icon: Trash2,
      className: "text-red-500",
      shouldRender: isAdmin,
    },
  ];

  return (
    <>
      <DeleteCustomerRequestsModal
        customerId={customerId}
        requestId={requestId}
        isModalOpen={isDeleteModalOpen}
        handleClose={() => setIsDeleteModalOpen(false)}
      />
      {parentRef && <ContextMenu parentRef={parentRef} items={MENU_ITEMS} />}
      <CustomMenu ellipsis placement="bottom-end" closeOnSelect>
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
