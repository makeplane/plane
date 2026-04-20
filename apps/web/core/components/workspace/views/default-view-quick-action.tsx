/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { useState } from "react";
import { observer } from "mobx-react";
import { Download } from "lucide-react";
// plane imports
import { E_FEATURE_FLAGS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { LinkIcon, NewTabIcon } from "@plane/propel/icons";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { TStaticViewTypes } from "@plane/types";
import { EIssuesStoreType } from "@plane/types";
import type { TContextMenuItem } from "@plane/ui";
import { CustomMenu } from "@plane/ui";
import { copyUrlToClipboard, cn } from "@plane/utils";
// components
import type { TExportProvider } from "@/components/common/quick-actions/export-modal";
import { ExportModal } from "@/components/common/quick-actions/export-modal";
// hooks
import { useIssues } from "@/hooks/store/use-issues";
import { useGlobalView } from "@/hooks/store/use-global-view";
import { useFlag } from "@/plane-web/hooks/store/use-flag";
// services
import exportService from "@/services/export.service";

type Props = {
  workspaceSlug: string;
  view: {
    key: TStaticViewTypes;
    i18n_label: string;
  };
};

export const DefaultWorkspaceViewQuickActions = observer(function DefaultWorkspaceViewQuickActions(props: Props) {
  const { workspaceSlug, view } = props;
  // states
  const [isOpen, setIsOpen] = useState(false);
  // plane hooks
  const { t } = useTranslation();
  const { permissions } = useGlobalView();
  const {
    issuesFilter: { getFilterParams },
  } = useIssues(EIssuesStoreType.GLOBAL);
  // derived values
  const isEnabled =
    useFlag(props.workspaceSlug, E_FEATURE_FLAGS.ADVANCED_EXPORTS) && permissions.getCanExport(view.key);

  const viewLink = `${workspaceSlug}/workspace-views/${view.key}`;
  const handleCopyText = async () => {
    try {
      await copyUrlToClipboard(viewLink);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("link_copied"),
        message: t("view_link_copied_to_clipboard"),
      });
    } catch (_error) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("toast.error"),
        message: t("common.link_copy_failed"),
      });
    }
  };
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
    {
      key: "export",
      title: t("export"),
      icon: Download,
      action: () => setIsOpen(true),
      shouldRender: isEnabled,
    },
  ];

  const handleExport = async (provider: TExportProvider) => {
    try {
      const filterParams = getFilterParams(
        { canGroup: false, perPageCount: 100 },
        view.key,
        undefined,
        undefined,
        undefined
      );
      delete filterParams.filters;
      delete filterParams.pql;
      await exportService.exportDefaultWorkspaceViewWorkItems(workspaceSlug, provider, filterParams);

      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Export started",
        message: "Your export will be ready soon.",
        actionItems: (
          <div className="flex items-center gap-1 text-11 text-secondary">
            <a
              href={`/${props.workspaceSlug}/settings/exports`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent-primary px-2 py-1 hover:bg-layer-1 font-medium rounded"
            >
              View Exports
            </a>
          </div>
        ),
      });
      setIsOpen(false);
    } catch (_error) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: "Failed to export view. Please try again.",
      });
    }
  };

  return (
    <>
      <ExportModal isOpen={isOpen} onClose={() => setIsOpen(false)} onConfirm={handleExport} />
      <CustomMenu
        ellipsis
        placement="bottom-end"
        closeOnSelect
        buttonClassName="shrink-0 flex items-center justify-center size-[26px] bg-layer-1/70 rounded-sm"
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
                    className={cn("text-tertiary whitespace-pre-line", {
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
