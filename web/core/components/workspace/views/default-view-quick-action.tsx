"use client";

import { observer } from "mobx-react";
import Link from "next/link";
import { ExternalLink, LinkIcon } from "lucide-react";
// ui
import { TStaticViewTypes } from "@plane/types";
import { ContextMenu, CustomMenu, TContextMenuItem, TOAST_TYPE, setToast } from "@plane/ui";
// helpers
import { cn } from "@/helpers/common.helper";
import { copyUrlToClipboard } from "@/helpers/string.helper";

type Props = {
  parentRef: React.RefObject<HTMLElement>;
  workspaceSlug: string;
  globalViewId: string | undefined;
  view: {
    key: TStaticViewTypes;
    label: string;
  };
};

export const DefaultWorkspaceViewQuickActions: React.FC<Props> = observer((props) => {
  const { parentRef, globalViewId, view, workspaceSlug } = props;

  const viewLink = `${workspaceSlug}/workspace-views/${view.key}`;
  const handleCopyText = () =>
    copyUrlToClipboard(viewLink).then(() => {
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Link Copied!",
        message: "View link copied to clipboard.",
      });
    });
  const handleOpenInNewTab = () => window.open(`/${viewLink}`, "_blank");

  const MENU_ITEMS: TContextMenuItem[] = [
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
  ];

  return (
    <>
      <ContextMenu parentRef={parentRef} items={MENU_ITEMS} />

      <CustomMenu
        customButton={
          <>
            {view.key === globalViewId ? (
              <span
                className={`flex min-w-min flex-shrink-0 whitespace-nowrap border-b-2 p-3 text-sm font-medium outline-none ${
                  view.key === globalViewId
                    ? "border-custom-primary-100 text-custom-primary-100"
                    : "border-transparent hover:border-custom-border-200 hover:text-custom-text-400"
                }`}
              >
                {view.label}
              </span>
            ) : (
              <Link
                key={view.key}
                id={`global-view-${view.key}`}
                href={`/${workspaceSlug}/workspace-views/${view.key}`}
              >
                <span
                  className={`flex min-w-min flex-shrink-0 whitespace-nowrap border-b-2 p-3 text-sm font-medium outline-none ${
                    view.key === globalViewId
                      ? "border-custom-primary-100 text-custom-primary-100"
                      : "border-transparent hover:border-custom-border-200 hover:text-custom-text-400"
                  }`}
                >
                  {view.label}
                </span>
              </Link>
            )}
          </>
        }
        placement="bottom-end"
        menuItemsClassName="z-20"
        closeOnSelect
      >
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
