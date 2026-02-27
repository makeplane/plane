import { observer } from "mobx-react";
import { MoreHorizontal, ExternalLink, Link2, Pencil, Trash2 } from "lucide-react";
import { CustomMenu } from "@plane/ui";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { IDashboardWidget } from "@plane/types";

interface Props {
  widget: IDashboardWidget;
  workspaceSlug: string;
  onEdit: () => void;
  onDelete: () => void;
}

export const WidgetContextMenu = observer(({ widget, workspaceSlug, onEdit, onDelete }: Props) => {
  const handleOpenInNewTab = () => {
    const queryParams = new URLSearchParams();
    if (widget.filters) {
      Object.entries(widget.filters).forEach(([key, values]: [string, unknown]) => {
        if (Array.isArray(values)) {
          queryParams.append(key, values.join(","));
        }
      });
    }
    const targetUrl = `/${workspaceSlug}/issues?${queryParams.toString()}`;
    window.open(targetUrl, "_blank");
  };

  const handleCopyLink = (): void => {
    const url = `${window.location.origin}/${workspaceSlug}/dashboards/${widget.dashboard}?widgetId=${widget.id}`;
    void navigator.clipboard.writeText(url).then(
      () => {
        setToast({ type: TOAST_TYPE.SUCCESS, title: "Link copied to clipboard" });
        return undefined;
      },
      () => {
        setToast({ type: TOAST_TYPE.ERROR, title: "Failed to copy link" });
        return undefined;
      }
    );
  };

  return (
    <CustomMenu
      placement="bottom-end"
      customButton={
        <button className="p-1 rounded hover:bg-layer-2 transition-colors text-color-tertiary hover:text-color-primary">
          <MoreHorizontal className="w-4 h-4" />
        </button>
      }
    >
      <CustomMenu.MenuItem onClick={onEdit}>
        <div className="flex items-center gap-2">
          <Pencil className="w-4 h-4" />
          <span>Edit</span>
        </div>
      </CustomMenu.MenuItem>

      <CustomMenu.MenuItem onClick={handleOpenInNewTab}>
        <div className="flex items-center gap-2">
          <ExternalLink className="w-4 h-4" />
          <span>Open in new tab</span>
        </div>
      </CustomMenu.MenuItem>

      <CustomMenu.MenuItem onClick={handleCopyLink}>
        <div className="flex items-center gap-2">
          <Link2 className="w-4 h-4" />
          <span>Copy link</span>
        </div>
      </CustomMenu.MenuItem>

      <div className="h-px bg-border-subtle my-1" />

      <CustomMenu.MenuItem onClick={onDelete}>
        <div className="flex items-center gap-2 text-color-danger-primary">
          <Trash2 className="w-4 h-4" />
          <span>Delete</span>
        </div>
      </CustomMenu.MenuItem>
    </CustomMenu>
  );
});
