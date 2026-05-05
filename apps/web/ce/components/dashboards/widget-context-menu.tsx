import { observer } from "mobx-react";
import { MoreHorizontal, ExternalLink, Link2, Pencil, Trash2 } from "lucide-react";
import { useTranslation } from "@plane/i18n";
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
  const { t } = useTranslation();

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
        setToast({ type: TOAST_TYPE.SUCCESS, title: t("analytics_dashboard.link_copied") });
        return undefined;
      },
      () => {
        setToast({ type: TOAST_TYPE.ERROR, title: t("analytics_dashboard.copy_link_failed") });
        return undefined;
      }
    );
  };

  return (
    <CustomMenu
      placement="bottom-end"
      customButton={
        <button className="p-1 rounded hover:bg-layer-2 transition-colors text-tertiary hover:text-primary">
          <MoreHorizontal className="w-4 h-4" />
        </button>
      }
    >
      <CustomMenu.MenuItem onClick={onEdit}>
        <div className="flex items-center gap-2">
          <Pencil className="w-4 h-4" />
          <span>{t("analytics_dashboard.context_edit")}</span>
        </div>
      </CustomMenu.MenuItem>

      <CustomMenu.MenuItem onClick={handleOpenInNewTab}>
        <div className="flex items-center gap-2">
          <ExternalLink className="w-4 h-4" />
          <span>{t("analytics_dashboard.context_open_new_tab")}</span>
        </div>
      </CustomMenu.MenuItem>

      <CustomMenu.MenuItem onClick={handleCopyLink}>
        <div className="flex items-center gap-2">
          <Link2 className="w-4 h-4" />
          <span>{t("analytics_dashboard.context_copy_link")}</span>
        </div>
      </CustomMenu.MenuItem>

      <div className="h-px bg-border-subtle my-1" />

      <CustomMenu.MenuItem onClick={onDelete}>
        <div className="flex items-center gap-2 text-danger-primary">
          <Trash2 className="w-4 h-4" />
          <span>{t("analytics_dashboard.context_delete")}</span>
        </div>
      </CustomMenu.MenuItem>
    </CustomMenu>
  );
});
