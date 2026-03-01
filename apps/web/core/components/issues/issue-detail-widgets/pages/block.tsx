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

import { observer } from "mobx-react";
import Link from "next/link";
import { CircleX, Files } from "lucide-react";
import { LinkIcon, PageIcon } from "@plane/propel/icons";
import { useTranslation } from "@plane/i18n";
import { Logo } from "@plane/propel/emoji-icon-picker";
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
import type { TIssuePage, TIssueServiceType, TLogoProps } from "@plane/types";
import type { TContextMenuItem } from "@plane/ui";
import { CustomMenu } from "@plane/ui";
import { calculateTimeAgo, cn, copyUrlToClipboard } from "@plane/utils";
import { ButtonAvatars } from "@/components/dropdowns/member/avatar";
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { useProject } from "@/hooks/store/use-project";

type TProps = {
  issueServiceType: TIssueServiceType;
  workItemId: string;
  workspaceSlug: string;
  projectId: string;
  page: TIssuePage;
};

export const PagesCollapsibleContentBlock = observer(function PagesCollapsibleContentBlock(props: TProps) {
  const { page, workspaceSlug, projectId, workItemId, issueServiceType } = props;
  // hooks
  const { t } = useTranslation();
  const { getProjectById } = useProject();
  const {
    pages: { deleteIssuePages },
  } = useIssueDetail(issueServiceType);
  // derived
  const project = getProjectById(projectId);

  const handleCopyText = () => {
    const url = page.is_global ? `pages/${page.id}` : `projects/${projectId}/pages/${page.id}`;

    copyUrlToClipboard(`${workspaceSlug}/${url}`).then(() => {
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("link_copied"),
        message: t("entity.link_copied_to_clipboard", { entity: t("page") }),
      });
    });
  };

  const handleRemove = async () => {
    deleteIssuePages(workspaceSlug, projectId, workItemId, page.id)
      .then(() => {
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: t("issue.pages.toasts.remove.success.title"),
          message: t("issue.pages.toasts.remove.success.message"),
        });
      })
      .catch(() => {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: t("issue.pages.toasts.remove.error.title"),
          message: t("issue.pages.toasts.remove.error.message"),
        });
      });
  };

  const MENU_ITEMS: TContextMenuItem[] = [
    {
      key: "copy",
      action: () => handleCopyText(),
      title: "Copy link",
      icon: () => <LinkIcon className="size-3 -rotate-45" />,
    },
    {
      key: "remove",
      action: () => handleRemove(),
      title: "Remove",
      icon: () => <CircleX className="size-3" />,
    },
  ];

  if (!page) return null;

  return (
    <div key={page.id} className="flex flex-col gap-2 rounded-xl border border-subtle p-4 pb-2 min-h-[166px]">
      <Link
        href={
          page.is_global
            ? `/${workspaceSlug}/wiki/${page.id}`
            : `/${workspaceSlug}/projects/${projectId}/pages/${page.id}`
        }
        target="_blank"
        className="border-b border-subtle pb-2 flex flex-col gap-2 flex-1"
      >
        <div className="flex gap-2 items-center max-w-full w-fit overflow-hidden bg-layer-1 p-1 rounded">
          <div className="my-auto">
            {page.is_global ? (
              <Files className="size-[14px] text-placeholder" />
            ) : (
              <Logo logo={project?.logo_props as TLogoProps} size={14} />
            )}
          </div>
          <span className="text-13 font-medium text-tertiary my-auto truncate">
            {page.is_global ? "Wiki" : project?.name}
          </span>
        </div>
        <div className="flex flex-col gap-2 ">
          <div className="flex gap-1 items-center">
            <div className="shrink-0">
              {page.logo_props && page.logo_props?.in_use ? (
                <Logo logo={page.logo_props} size={16} type="lucide" />
              ) : (
                <PageIcon className="size-4 text-tertiary" />
              )}
            </div>
            <div className="text-14 font-medium text-secondary line-clamp-2 overflow-hidden break-words min-w-0 flex-1">
              {page.name}
            </div>
          </div>
          <div className="text-13 text-tertiary line-clamp-3 overflow-hidden">
            {page.description_stripped === "" ? t("issue.pages.no_description") : page.description_stripped}
          </div>
        </div>
      </Link>
      <div className="flex gap-2 justify-between items-center">
        <div>{page.created_by && <ButtonAvatars showTooltip userIds={[page.created_by]} />}</div>
        <div className="flex gap-2">
          {page.updated_at && (
            <div className="text-11 text-tertiary">Last updated {calculateTimeAgo(page.updated_at)}</div>
          )}
          <CustomMenu
            placement="bottom-end"
            menuItemsClassName="z-20"
            buttonClassName="!p-0.5 text-tertiary"
            closeOnSelect
            verticalEllipsis
          >
            {MENU_ITEMS.map((item) => (
              <CustomMenu.MenuItem
                key={item.key}
                onClick={() => {
                  item.action();
                }}
                className={cn("flex items-center gap-2")}
              >
                {item.icon && <item.icon />}
                <div>
                  <h5>{item.title}</h5>
                </div>
              </CustomMenu.MenuItem>
            ))}
          </CustomMenu>
        </div>
      </div>
    </div>
  );
});
