import { useState } from "react";
import { observer } from "mobx-react";
import { Pencil, Trash2 } from "lucide-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import type { TOperationMode } from "@plane/types";
import { CustomMenu, TContextMenuItem } from "@plane/ui";
import { cn } from "@plane/utils";
// plane web imports
import { captureClick } from "@/helpers/event-tracker.helper";
// local imports
import { DeleteConfirmationModal } from "./delete-confirmation-modal";

type TIssuePropertyQuickActions = {
  isPropertyDisabled: boolean;
  onDisable: () => Promise<void>;
  onDelete: () => Promise<void>;
  onIssuePropertyOperationMode: (mode: TOperationMode) => void;
  trackers?: {
    [key in "create" | "update" | "delete" | "quickActions"]?: {
      button?: string;
      eventName?: string;
    };
  };
};

export const IssuePropertyQuickActions = observer((props: TIssuePropertyQuickActions) => {
  const { isPropertyDisabled, onDisable, onDelete, onIssuePropertyOperationMode, trackers } = props;
  // plane hooks
  const { t } = useTranslation();
  // states
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const MENU_ITEMS: TContextMenuItem[] = [
    {
      key: "edit",
      action: () => {
        captureClick({
          elementName: trackers?.quickActions?.button || "",
        });
        onIssuePropertyOperationMode("update");
      },
      title: t("common.actions.edit"),
      icon: Pencil,
    },
    {
      key: "delete",
      action: () => {
        captureClick({
          elementName: trackers?.quickActions?.button || "",
        });
        setIsDeleteModalOpen(true);
      },
      title: t("common.actions.delete"),
      icon: Trash2,
    },
  ];

  return (
    <>
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        isDisabledAlready={isPropertyDisabled}
        onClose={() => setIsDeleteModalOpen(false)}
        onDisable={onDisable}
        onDelete={onDelete}
      />
      <CustomMenu placement="bottom-end" menuItemsClassName="z-20" buttonClassName="!p-0.5" closeOnSelect ellipsis>
        {MENU_ITEMS.map((item) => (
          <CustomMenu.MenuItem
            key={item.key}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              item.action();
            }}
            className={cn("flex items-center gap-2")}
          >
            {item.icon && <item.icon className={cn("h-3 w-3")} />}
            <div>
              <h5>{item.title}</h5>
            </div>
          </CustomMenu.MenuItem>
        ))}
      </CustomMenu>
    </>
  );
});
