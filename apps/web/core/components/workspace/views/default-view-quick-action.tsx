/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";

import { useTranslation } from "@workspaces/i18n";
// workspaces imports
import { LinkIcon, NewTabIcon } from "@workspaces/propel/icons";
import { TOAST_TYPE, setToast } from "@workspaces/propel/toast";
// ui
import type { TStaticViewTypes } from "@workspaces/types";
import type { TContextMenuItem } from "@workspaces/ui";
import { CustomMenu } from "@workspaces/ui";
import { copyUrlToClipboard, cn } from "@workspaces/utils";
// helpers
type Props = {
  workspaceSlug: string;
  view: {
    key: TStaticViewTypes;
    i18n_label: string;
  };
};

export const DefaultWorkspaceViewQuickActions = observer(function DefaultWorkspaceViewQuickActions(props: Props) {
  const { workspaceSlug, view } = props;

  const { t } = useTranslation();

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
      title: t("open_in_new_tab"),
      icon: NewTabIcon,
    },
    {
      key: "copy-link",
      action: handleCopyText,
      title: t("copy_link"),
      icon: LinkIcon,
    },
  ];

  return (
    <>
      <CustomMenu
        ellipsis
        placement="bottom-end"
        closeOnSelect
        buttonClassName="flex-shrink-0 flex items-center justify-center size-[26px] bg-layer-1/70 rounded-sm"
      >
        {MENU_ITEMS.map((item) => {
          if (item.shouldRender === false) return null;
          return (
            <CustomMenu.MenuItem
              key={item.key}
              onClick={() => {
                item.action();
              }}
              className={cn(
                "flex items-center gap-2",
                {
                  "text-placeholder": item.disabled,
                },
                item.className
              )}
              disabled={item.disabled}
            >
              {item.icon && <item.icon className={cn("h-3 w-3", item.iconClassName)} />}
              <div>
                <h5>{t(item.title || "")}</h5>
                {item.description && (
                  <p
                    className={cn("whitespace-pre-line text-tertiary", {
                      "text-placeholder": item.disabled,
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
