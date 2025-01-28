"use client";

import { useState } from "react";
import { observer } from "mobx-react";
// icons
import { ExternalLink, LinkIcon, Pencil, Trash2 } from "lucide-react";
// ui
import { ContextMenu, CustomMenu, TContextMenuItem, TOAST_TYPE, setToast } from "@plane/ui";
import { cn } from "@plane/utils";
// helpers
import { copyUrlToClipboard } from "@/helpers/string.helper";
// Plane-web
import { TInitiative } from "@/plane-web/types/initiative";
// local components
import { CreateUpdateInitiativeModal } from "./create-update-initiatives-modal";
import { InitiativeDeleteModal } from "./initiative-delete-modal";

type Props = {
  parentRef: React.RefObject<HTMLElement>;
  initiative: TInitiative;
  workspaceSlug: string;
  disabled?: boolean;
};

export const InitiativeQuickActions: React.FC<Props> = observer((props) => {
  const { parentRef, initiative, workspaceSlug, disabled = false } = props;
  // states
  const [updateModal, setUpdateModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);

  const initiativeLink = `${workspaceSlug}/initiatives/${initiative?.id}`;
  const handleCopyText = () =>
    copyUrlToClipboard(initiativeLink).then(() => {
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Link Copied!",
        message: "Initiative link copied to clipboard.",
      });
    });
  const handleOpenInNewTab = () => window.open(`/${initiativeLink}`, "_blank");

  const handleEditCycle = () => {
    setUpdateModal(true);
  };

  const handleDeleteCycle = () => {
    setDeleteModal(true);
  };

  const MENU_ITEMS: TContextMenuItem[] = [
    {
      key: "edit",
      title: "Edit",
      icon: Pencil,
      action: handleEditCycle,
      shouldRender: !disabled,
    },
    {
      key: "open-new-tab",
      action: handleOpenInNewTab,
      title: "Open in new tab",
      icon: ExternalLink,
    },
    {
      key: "copy-link",
      action: handleCopyText,
      title: "Copy link",
      icon: LinkIcon,
    },
    {
      key: "delete",
      action: handleDeleteCycle,
      title: "Delete",
      icon: Trash2,
      shouldRender: !disabled,
    },
  ];

  return (
    <>
      {initiative && (
        <div className="fixed">
          <CreateUpdateInitiativeModal
            initiativeId={initiative?.id}
            isOpen={updateModal}
            handleClose={() => setUpdateModal(false)}
          />
          <InitiativeDeleteModal
            initiative={initiative}
            isOpen={deleteModal}
            handleClose={() => setDeleteModal(false)}
            workspaceSlug={workspaceSlug}
          />
        </div>
      )}
      <ContextMenu parentRef={parentRef} items={MENU_ITEMS} />
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
