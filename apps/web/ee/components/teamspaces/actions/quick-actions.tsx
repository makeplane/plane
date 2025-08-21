"use client";

import { useState } from "react";
import { observer } from "mobx-react";
import { ExternalLink, Link2, Pencil, Trash2 } from "lucide-react";
// plane imports
import { TEAMSPACE_TRACKER_ELEMENTS } from "@plane/constants";
import { ContextMenu, CustomMenu, TContextMenuItem, TOAST_TYPE, setToast } from "@plane/ui";
import { cn, copyUrlToClipboard } from "@plane/utils";
// hooks
import { captureClick } from "@/helpers/event-tracker.helper";
import { useCommandPalette } from "@/hooks/store/use-command-palette";
// plane web constants
import { DeleteTeamspaceModal } from "@/plane-web/components/teamspaces/actions";

type Props = {
  teamspaceId: string;
  workspaceSlug: string;
  parentRef: React.RefObject<HTMLDivElement> | null;
  isEditingAllowed: boolean;
  hideEdit?: boolean;
  buttonClassName?: string;
  trackerElement: string;
};

export const TeamQuickActions: React.FC<Props> = observer((props) => {
  const { teamspaceId, workspaceSlug, parentRef, isEditingAllowed, hideEdit, buttonClassName, trackerElement } = props;
  // states
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  // store hooks
  const { toggleCreateTeamspaceModal } = useCommandPalette();
  // derived values
  const teamLink = `${workspaceSlug}/teamspaces/${teamspaceId}`;

  const handleEditTeam = () => {
    toggleCreateTeamspaceModal({ isOpen: true, teamspaceId });
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
      title: "Copy link to teamspace",
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

  const CONTEXT_MENU_ITEMS: TContextMenuItem[] = MENU_ITEMS.map((item) => ({
    ...item,
    action: () => {
      item.action();
      captureClick({
        elementName: TEAMSPACE_TRACKER_ELEMENTS.CONTEXT_MENU,
      });
    },
  }));

  return (
    <>
      <DeleteTeamspaceModal
        teamspaceId={teamspaceId}
        isModalOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
      />
      {parentRef && <ContextMenu parentRef={parentRef} items={CONTEXT_MENU_ITEMS} />}
      <CustomMenu ellipsis placement="bottom-end" closeOnSelect buttonClassName={buttonClassName}>
        {MENU_ITEMS.map((item) => {
          if (item.shouldRender === false) return null;
          return (
            <CustomMenu.MenuItem
              key={item.key}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                captureClick({
                  elementName: trackerElement,
                });
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
