import { ExternalLink, Link, Pencil } from "lucide-react";
// ui
import { ArchiveIcon, CustomMenu } from "@plane/ui";

type Props = {
  pageId: string;
};

export const PageQuickActions: React.FC<Props> = (props) => {
  const {} = props;

  return (
    <CustomMenu placement="bottom-end" ellipsis closeOnSelect>
      <CustomMenu.MenuItem
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
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
        }}
      >
        <span className="flex items-center gap-2">
          <ArchiveIcon className="h-3 w-3" />
          Archive
        </span>
      </CustomMenu.MenuItem>
    </CustomMenu>
  );
};
