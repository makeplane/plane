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

import { Ellipsis } from "lucide-react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane imports
import { useTranslation } from "@plane/i18n";
import { IconButton } from "@plane/propel/icon-button";
import { LinkIcon, TrashIcon } from "@plane/propel/icons";
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
import type { TContextMenuItem } from "@plane/ui";
import { ContextMenu, CustomMenu } from "@plane/ui";
import { cn, copyUrlToClipboard, formatProjectWorkItemIdentifierForDisplay, generateWorkItemLink } from "@plane/utils";
// hooks
import type { IQuickActionProps } from "@/components/issues/issue-layouts/list/list-view-types";
import { useProject } from "@/hooks/store/use-project";
// plane web imports
import { useInitiatives } from "@/plane-web/hooks/store/use-initiatives";

export const InitiativeScopeEpicQuickActions = observer(function InitiativeScopeEpicQuickActions(
  props: IQuickActionProps
) {
  const { issue, parentRef, readOnly = false } = props;
  // router
  const { initiativeId, workspaceSlug } = useParams();
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const { getProjectIdentifierById } = useProject();
  const {
    initiative: {
      scope: {
        epics: { removeEpicFromInitiative },
      },
    },
  } = useInitiatives();
  // derived values
  const projectIdentifier = getProjectIdentifierById(issue.project_id);
  const workItemLink = generateWorkItemLink({
    workspaceSlug: workspaceSlug?.toString(),
    projectId: issue.project_id,
    issueId: issue.id,
    projectIdentifier,
    sequenceId: issue.sequence_id,
  });

  const handleCopyText = () =>
    copyUrlToClipboard(workItemLink).then(() =>
      setToast({
        type: TOAST_TYPE.INFO,
        title: `${t("common.link_copied")}!`,
        message: t("epics.epic_link_copied_to_clipboard"),
      })
    );

  const MENU_ITEMS: TContextMenuItem[] = [
    {
      key: "copy-link",
      action: handleCopyText,
      title: t("copy_link"),
      icon: LinkIcon,
      shouldRender: true,
    },
    {
      key: "remove-from-initiative",
      action: () =>
        initiativeId &&
        removeEpicFromInitiative(workspaceSlug?.toString() ?? "", initiativeId.toString(), issue.id).then(() =>
          setToast({
            type: TOAST_TYPE.SUCCESS,
            title: "Success!",
            message: `You have removed the epic ${formatProjectWorkItemIdentifierForDisplay(projectIdentifier || "", issue.sequence_id)} from this initiative.`,
          })
        ),
      title: t("common.remove"),
      icon: TrashIcon,
      shouldRender: !!initiativeId && !readOnly,
    },
  ];

  return (
    <>
      <ContextMenu parentRef={parentRef} items={MENU_ITEMS} />
      <CustomMenu
        ellipsis
        menuItemsClassName="z-[14]"
        maxHeight="lg"
        useCaptureForOutsideClick
        closeOnSelect
        customButton={<IconButton variant="secondary" icon={Ellipsis} size="lg" />}
      >
        {MENU_ITEMS.filter((item) => item.shouldRender).map((item) => (
          <CustomMenu.MenuItem
            key={item.key}
            onClick={() => {
              item.action();
            }}
          >
            <div className="flex items-center gap-2">
              {item.icon && <item.icon className={cn("h-3 w-3", item.iconClassName)} />}
              <span>{item.title}</span>
            </div>
          </CustomMenu.MenuItem>
        ))}
      </CustomMenu>
    </>
  );
});
