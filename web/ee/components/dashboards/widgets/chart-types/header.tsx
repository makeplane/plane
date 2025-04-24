import { useMemo } from "react";
import { observer } from "mobx-react";
import { Pencil, RotateCw, Trash2 } from "lucide-react";
// plane imports
import { ContextMenu, CustomMenu, DragHandle, TContextMenuItem, Tooltip } from "@plane/ui";
import { cn } from "@plane/utils";
// plane web hooks
import { useDashboards } from "@/plane-web/hooks/store";
// plane web store
import { DashboardWidgetInstance } from "@/plane-web/store/dashboards/widget";
// local imports
import { WIDGET_HEADER_HEIGHT, WIDGET_Y_SPACING } from ".";

type Props = {
  className?: string;
  dashboardId: string;
  widget: DashboardWidgetInstance;
  widgetRef: React.RefObject<HTMLDivElement>;
};

export const DashboardWidgetHeader: React.FC<Props> = observer((props) => {
  const { className, dashboardId, widget, widgetRef } = props;
  // store hooks
  const { getDashboardById } = useDashboards();
  // derived values
  const dashboardDetails = getDashboardById(dashboardId);
  const { widgetsStore, isViewModeEnabled } = dashboardDetails ?? {};
  const { toggleDeleteWidget, toggleEditWidget } = widgetsStore ?? {};
  const { canCurrentUserDeleteWidget, canCurrentUserEditWidget, fetchWidgetData, isFetchingData } = widget;

  const MENU_ITEMS: TContextMenuItem[] = useMemo(
    () => [
      {
        key: "edit",
        icon: Pencil,
        title: "Edit",
        action: () => {
          if (!widget.id) return;
          toggleEditWidget?.(widget.id);
        },
        shouldRender: canCurrentUserEditWidget,
      },
      {
        key: "refresh",
        icon: RotateCw,
        title: "Refresh",
        action: () => fetchWidgetData?.(),
        disabled: isFetchingData,
      },
      {
        key: "delete",
        icon: Trash2,
        title: "Delete",
        action: () => {
          if (!widget.id) return;
          toggleDeleteWidget?.(widget.id);
        },
        shouldRender: canCurrentUserDeleteWidget,
      },
    ],
    [
      canCurrentUserDeleteWidget,
      canCurrentUserEditWidget,
      fetchWidgetData,
      isFetchingData,
      toggleDeleteWidget,
      toggleEditWidget,
      widget.id,
    ]
  );

  return (
    <div
      className={cn("relative p-4 pb-0 flex items-center justify-between gap-2 truncate", className)}
      style={{
        height: WIDGET_HEADER_HEIGHT,
        marginBottom: WIDGET_Y_SPACING,
      }}
    >
      <div
        className="widget-drag-handle cursor-grab truncate"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
      >
        {!isViewModeEnabled && (
          <DragHandle className="absolute top-6 -translate-y-1/2 left-0.5 bg-transparent p-0 opacity-0 pointer-events-none group-hover/widget:opacity-100 group-hover/widget:pointer-events-auto transition-opacity" />
        )}
        <h5 className="text-sm font-medium text-custom-text-200 truncate">{widget.name}</h5>
      </div>
      <div className="flex-shrink-0 hidden group-hover/widget:flex items-center">
        {!isViewModeEnabled && canCurrentUserEditWidget && (
          <Tooltip tooltipContent="Edit">
            <button
              type="button"
              className="grid place-items-center p-1 rounded text-custom-text-200 hover:text-custom-text-100 hover:bg-custom-background-80"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (!widget.id) return;
                toggleEditWidget?.(widget.id);
              }}
            >
              <Pencil className="size-3.5" />
            </button>
          </Tooltip>
        )}
        <Tooltip tooltipContent="Refresh">
          <button
            type="button"
            className="grid place-items-center p-1 rounded text-custom-text-200 hover:text-custom-text-100 hover:bg-custom-background-80"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              fetchWidgetData();
            }}
            disabled={isFetchingData}
          >
            <RotateCw
              className={cn("size-3.5", {
                "animate-spin": isFetchingData,
              })}
            />
          </button>
        </Tooltip>
        {!isViewModeEnabled && (
          <>
            <ContextMenu parentRef={widgetRef} items={MENU_ITEMS} />
            <CustomMenu placement="bottom-end" verticalEllipsis closeOnSelect>
              {MENU_ITEMS.filter((i) => i.key === "delete").map((item) => {
                if (item.shouldRender === false) return null;
                return (
                  <CustomMenu.MenuItem
                    key={item.key}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      item.action();
                    }}
                    className="flex items-center gap-2"
                    disabled={item.disabled}
                  >
                    {item.icon && <item.icon className="flex-shrink-0 size-3" />}
                    {item.title}
                  </CustomMenu.MenuItem>
                );
              })}
            </CustomMenu>
          </>
        )}
      </div>
    </div>
  );
});
