import { observer } from "mobx-react";
import { ArchiveRestoreIcon, ExternalLink, Link, Pencil } from "lucide-react";
import { ArchiveIcon, CustomMenu, TOAST_TYPE, setToast } from "@plane/ui";
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
  // hooks
  const { archive, archived_at, restore } = usePage(pageId);

  const pageLink = `${workspaceSlug}/projects/${projectId}/cycles/${pageId}`;
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
        }}
      >
        <span className="flex items-center gap-2">
          <Pencil className="h-3 w-3" />
          Edit
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
    </CustomMenu>
  );
});
