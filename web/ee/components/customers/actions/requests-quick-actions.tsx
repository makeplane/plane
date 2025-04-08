"use client";

import { observer } from "mobx-react";
import { Link2, Pencil, Trash2 } from "lucide-react";
// plane imports
import { EUserPermissionsLevel, EUserWorkspaceRoles } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { ContextMenu, CustomMenu, TContextMenuItem, TOAST_TYPE, setToast } from "@plane/ui";
import { cn, copyUrlToClipboard } from "@plane/utils";
// plane web constants
import { useUserPermissions } from "@/hooks/store";
import { DeleteCustomerRequestsModal } from "@/plane-web/components/customers/actions";
import { useCustomers } from "@/plane-web/hooks/store";

type Props = {
  customerId: string;
  requestId: string;
  parentRef: React.RefObject<HTMLDivElement> | null;
  handleEdit: () => void;
  workspaceSlug: string;
  workItemId?: string;
};

export const CustomerRequestQuickActions: React.FC<Props> = observer((props) => {
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
      action: () => toggleDeleteRequestModal(requestId),
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
