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
import { MoreHorizontal } from "lucide-react";
import { LinkIcon, TrashIcon } from "@plane/propel/icons";
// Plane
import { useTranslation } from "@plane/i18n";
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
import { EIssueServiceType } from "@plane/types";
import type { TContextMenuItem } from "@plane/ui";
import { CustomMenu } from "@plane/ui";
import { cn, copyUrlToClipboard, formatProjectWorkItemIdentifierForDisplay, generateWorkItemLink } from "@plane/utils";
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { useProject } from "@/hooks/store/use-project";
// Plane-web
import { useInitiatives } from "@/plane-web/hooks/store/use-initiatives";

type Props = {
  workspaceSlug: string;
  epicId: string;
  initiativeId: string;
  canRemove: boolean;
};

export const EpicQuickActions = observer(function EpicQuickActions(props: Props) {
  const { workspaceSlug, initiativeId, epicId, canRemove } = props;
  //  store hooks
  const {
    initiative: {
      scope: {
        epics: { removeEpicFromInitiative },
      },
    },
  } = useInitiatives();
  const {
    issue: { getIssueById },
  } = useIssueDetail(EIssueServiceType.EPICS);
  const { getProjectIdentifierById } = useProject();

  const { t } = useTranslation();

  // derived values
  const epic = getIssueById(epicId);
  const projectIdentifier = getProjectIdentifierById(epic?.project_id);

  const workItemLink = generateWorkItemLink({
    workspaceSlug,
    projectId: epic?.project_id,
    issueId: epic?.id,
    projectIdentifier,
    sequenceId: epic?.sequence_id,
  });

  // handler
  const handleCopyText = () =>
    copyUrlToClipboard(workItemLink).then(() =>
      setToast({
        type: TOAST_TYPE.INFO,
        title: `${t("common.link_copied")}!`,
        message: t("epics.epic_link_copied_to_clipboard"),
      })
    );

  if (!epic || !epic.project_id) return null;

  // menu items
  const MENU_ITEMS: TContextMenuItem[] = [
    {
      key: "copy-link",
      action: handleCopyText,
      title: t("copy_link"),
      icon: LinkIcon,
      shouldRender: true,
    },
    {
      key: "remove",
      action: () =>
        removeEpicFromInitiative(workspaceSlug, initiativeId, epic?.id).then(async () => {
          setToast({
            title: "Success!",
            type: TOAST_TYPE.SUCCESS,
            message: `You have removed the epic ${formatProjectWorkItemIdentifierForDisplay(projectIdentifier || "", epic?.sequence_id)} from this initiative.`,
          });
        }),
      title: t("common.remove"),
      icon: TrashIcon,
      shouldRender: canRemove,
    },
  ];

  return (
    <>
      <CustomMenu
        customButton={
          <span className="grid place-items-center p-0.5  rounded-sm my-auto">
            <MoreHorizontal className="size-4" />
          </span>
        }
        className={cn("flex justify-center items-center pointer-events-auto flex-shrink-0 my-auto rounded-sm  ")}
        customButtonClassName="grid place-items-center"
        placement="top-start"
      >
        {MENU_ITEMS.filter((item) => item.shouldRender).map((item) => (
          <CustomMenu.MenuItem
            key={item.key}
            onClick={() => {
              item.action();
            }}
          >
            <div className="flex items-center justify-start gap-2">
              {item.icon && <item.icon className={cn("h-3 w-3", item.iconClassName)} />}
              <span>{item.title}</span>
            </div>
          </CustomMenu.MenuItem>
        ))}
      </CustomMenu>
    </>
  );
});
