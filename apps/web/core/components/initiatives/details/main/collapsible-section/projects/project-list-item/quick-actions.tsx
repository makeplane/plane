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
import type { TContextMenuItem } from "@plane/ui";
import { CustomMenu } from "@plane/ui";
import { cn, copyUrlToClipboard } from "@plane/utils";
// Plane-web
import { useInitiatives } from "@/plane-web/hooks/store/use-initiatives";
import type { TProject } from "@/types/projects";

type Props = {
  workspaceSlug: string;
  project: TProject;
  initiativeId: string;
  canRemove: boolean;
};

export const QuickActions = observer(function QuickActions(props: Props) {
  const { workspaceSlug, initiativeId, project, canRemove } = props;
  // store hooks
  const {
    initiative: { updateInitiative, getInitiativeById },
  } = useInitiatives();
  const { t } = useTranslation();

  // derived states
  const projectLink = `${workspaceSlug}/projects/${project.id}/issues`;
  const initiative = getInitiativeById(initiativeId);

  // handler
  const handleCopyText = () =>
    copyUrlToClipboard(projectLink).then(() =>
      setToast({
        type: TOAST_TYPE.INFO,
        title: t("common.link_copied"),
        message: t("project_link_copied_to_clipboard"),
      })
    );

  const MENU_ITEMS: TContextMenuItem[] = [
    {
      key: "copy-link",
      action: handleCopyText,
      title: t("copy_link"),
      icon: LinkIcon,
    },
    {
      key: "remove",
      action: () =>
        updateInitiative(workspaceSlug, initiativeId, {
          project_ids: initiative?.project_ids ? initiative?.project_ids.filter((id) => id !== project.id) : [],
        }).then(async () => {
          setToast({
            type: TOAST_TYPE.SUCCESS,
            title: "Success!",
            message: `You have removed the project ${project.name} from this initiative.`,
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
        {MENU_ITEMS.filter((item) => item.shouldRender !== false).map((item) => (
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
