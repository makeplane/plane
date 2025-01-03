"use client";

import { useState } from "react";
import { observer } from "mobx-react";
// icons
import { ExternalLink, Link2, Pencil, Trash2 } from "lucide-react";
// ui
import { ContextMenu, CustomMenu, TContextMenuItem, TOAST_TYPE, setToast } from "@plane/ui";
// helpers
import { cn } from "@/helpers/common.helper";
import { copyUrlToClipboard } from "@/helpers/string.helper";
// hooks
import { useCommandPalette } from "@/hooks/store";
// plane web constants
import { DeleteTeamModal } from "@/plane-web/components/teams/actions";

type Props = {
  teamId: string;
  workspaceSlug: string;
  parentRef: React.RefObject<HTMLDivElement> | null;
  isEditingAllowed: boolean;
  hideEdit?: boolean;
  buttonClassName?: string;
};

export const TeamQuickActions: React.FC<Props> = observer((props) => {
  const { teamId, workspaceSlug, parentRef, isEditingAllowed, hideEdit, buttonClassName } = props;
  // states
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  // store hooks
  const { toggleCreateTeamModal } = useCommandPalette();
  // derived values
  const teamLink = `${workspaceSlug}/teams/${teamId}`;

  const handleEditTeam = () => {
    toggleCreateTeamModal({ isOpen: true, teamId });
  };

  const handleOpenInNewTab: () => void = () => window.open(`/${teamLink}`, "_blank");

  const handleCopyText = () =>
    copyUrlToClipboard(teamLink).then(() => {
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Link copied",
        message: "Paste it anywhere you like.",
      });
    });

  const handleDeleteTeam = () => {
    setIsDeleteModalOpen(true);
  };

  const MENU_ITEMS: TContextMenuItem[] = [
    {
      key: "edit",
      title: "Edit",
      icon: Pencil,
      action: handleEditTeam,
      shouldRender: !hideEdit && isEditingAllowed,
    },
    {
      key: "open-new-tab",
      action: handleOpenInNewTab,
      title: "Open in a new tab",
      icon: ExternalLink,
    },
    {
      key: "copy-link",
      action: handleCopyText,
      title: "Copy link to team",
      icon: Link2,
      iconClassName: "-rotate-45",
    },
    {
      key: "delete",
      action: handleDeleteTeam,
      title: "Delete",
      icon: Trash2,
      shouldRender: isEditingAllowed,
      className: "text-red-500",
    },
  ];

  return (
    <>
      <DeleteTeamModal teamId={teamId} isModalOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} />
      {parentRef && <ContextMenu parentRef={parentRef} items={MENU_ITEMS} />}
      <CustomMenu ellipsis placement="bottom-end" closeOnSelect buttonClassName={buttonClassName}>
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
