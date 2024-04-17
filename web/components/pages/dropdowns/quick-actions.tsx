import { useState } from "react";
import { observer } from "mobx-react";
import { ArchiveRestoreIcon, ExternalLink, Link, Lock, Trash2, UsersRound } from "lucide-react";
import { ArchiveIcon, CustomMenu, TOAST_TYPE, setToast } from "@plane/ui";
// components
import { DeletePageModal } from "@/components/pages";
// helpers
import { copyUrlToClipboard } from "@/helpers/string.helper";
// hooks
import { usePage } from "@/hooks/store";

type Props = {
  pageId: string;
  projectId: string;
  workspaceSlug: string;
};

export const PageQuickActions: React.FC<Props> = observer((props) => {
  const { pageId, projectId, workspaceSlug } = props;
  // states
  const [deletePageModal, setDeletePageModal] = useState(false);
  // store hooks
  const {
    access,
    archive,
    archived_at,
    makePublic,
    makePrivate,
    restore,
    canCurrentUserArchivePage,
    canCurrentUserChangeAccess,
    canCurrentUserDeletePage,
  } = usePage(pageId);

  const pageLink = `${workspaceSlug}/projects/${projectId}/pages/${pageId}`;
  const handleCopyText = () =>
    copyUrlToClipboard(pageLink).then(() => {
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Link Copied!",
        message: "Page link copied to clipboard.",
      });
    });

  const handleOpenInNewTab = () => window.open(`/${pageLink}`, "_blank");

  const MENU_ITEMS: {
    key: string;
    action: () => void;
    label: string;
    icon: React.FC<any>;
    shouldRender: boolean;
  }[] = [
    {
      key: "copy-link",
      action: handleCopyText,
      label: "Copy link",
      icon: Link,
      shouldRender: true,
    },
    {
      key: "open-new-tab",
      action: handleOpenInNewTab,
      label: "Open in new tab",
      icon: ExternalLink,
      shouldRender: true,
    },
    {
      key: "archive-restore",
      action: archived_at ? restore : archive,
      label: archived_at ? "Restore" : "Archive",
      icon: archived_at ? ArchiveRestoreIcon : ArchiveIcon,
      shouldRender: canCurrentUserArchivePage,
    },
    {
      key: "make-public-private",
      action: access === 0 ? makePrivate : makePublic,
      label: access === 0 ? "Make private" : "Make public",
      icon: access === 0 ? Lock : UsersRound,
      shouldRender: canCurrentUserChangeAccess && !archived_at,
    },
    {
      key: "delete",
      action: () => setDeletePageModal(true),
      label: "Delete",
      icon: Trash2,
      shouldRender: canCurrentUserDeletePage && !!archived_at,
    },
  ];

  return (
    <>
      <DeletePageModal
        isOpen={deletePageModal}
        onClose={() => setDeletePageModal(false)}
        pageId={pageId}
        projectId={projectId}
      />
      <CustomMenu placement="bottom-end" ellipsis closeOnSelect>
        {MENU_ITEMS.map((item) => {
          if (!item.shouldRender) return null;
          return (
            <CustomMenu.MenuItem
              key={item.key}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                item.action();
              }}
              className="flex items-center gap-2"
            >
              <item.icon className="h-3 w-3" />
              {item.label}
            </CustomMenu.MenuItem>
          );
        })}
      </CustomMenu>
    </>
  );
});
