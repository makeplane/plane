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
  const { access, archive, archived_at, makePublic, makePrivate, restore } = usePage(pageId);

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

  return (
    <>
      <DeletePageModal
        isOpen={deletePageModal}
        onClose={() => setDeletePageModal(false)}
        pageId={pageId}
        projectId={projectId}
      />
      <CustomMenu placement="bottom-end" ellipsis closeOnSelect>
        <CustomMenu.MenuItem
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleCopyText();
          }}
        >
          <span className="flex items-center gap-2">
            <Link className="h-3 w-3" />
            Copy link
          </span>
        </CustomMenu.MenuItem>
        <CustomMenu.MenuItem
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleOpenInNewTab();
          }}
        >
          <span className="flex items-center gap-2">
            <ExternalLink className="h-3 w-3" />
            Open in new tab
          </span>
        </CustomMenu.MenuItem>
        <CustomMenu.MenuItem
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (archived_at) restore();
            else archive();
          }}
        >
          <span className="flex items-center gap-2">
            {archived_at ? (
              <>
                <ArchiveRestoreIcon className="h-3 w-3" />
                Restore
              </>
            ) : (
              <>
                <ArchiveIcon className="h-3 w-3" />
                Archive
              </>
            )}
          </span>
        </CustomMenu.MenuItem>
        {!archived_at && (
          <CustomMenu.MenuItem
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              access === 0 ? makePrivate() : makePublic();
            }}
          >
            <span className="flex items-center gap-2">
              {access === 0 ? (
                <>
                  <Lock className="h-3 w-3" />
                  Make private
                </>
              ) : (
                <>
                  <UsersRound className="h-3 w-3" />
                  Make public
                </>
              )}
            </span>
          </CustomMenu.MenuItem>
        )}
        {archived_at && (
          <CustomMenu.MenuItem
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setDeletePageModal(true);
            }}
          >
            <span className="flex items-center gap-2">
              <Trash2 className="h-3 w-3" />
              Delete
            </span>
          </CustomMenu.MenuItem>
        )}
      </CustomMenu>
    </>
  );
});
