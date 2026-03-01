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

import { cn, CustomMenu } from "@plane/ui";
import { copyUrlToClipboard } from "@plane/utils";
import { useLayoutMenuItems } from "@/components/common/quick-actions/helper";

type Props = {
  workspaceSlug: string;
  projectId: string;
};

export function EpicLayoutQuickActions(props: Props) {
  const { workspaceSlug, projectId } = props;

  const handleCopyLink = () => {
    copyUrlToClipboard(`/${workspaceSlug}/projects/${projectId}/epics`);
  };

  const handleOpenInNewTab = () => window.open(`/${workspaceSlug}/projects/${projectId}/epics`, "_blank");

  const { items, modals } = useLayoutMenuItems({
    workspaceSlug,
    projectId,
    storeType: "EPIC",
    handleCopyLink,
    handleOpenInNewTab,
  });

  return (
    <>
      <CustomMenu
        ellipsis
        placement="bottom-end"
        closeOnSelect
        maxHeight="lg"
        className="flex-shrink-0 flex items-center justify-center size-[26px] bg-layer-1/70 rounded"
      >
        {items.map((item) => {
          if (item.shouldRender === false) return null;
          return (
            <CustomMenu.MenuItem
              key={item.key}
              onClick={item.action}
              className={cn("flex items-center gap-2", {
                "text-placeholder": item.disabled,
              })}
              disabled={item.disabled}
            >
              {item.icon && <item.icon className="h-3 w-3" />}
              <span>{item.title}</span>
            </CustomMenu.MenuItem>
          );
        })}
      </CustomMenu>
      {modals}
    </>
  );
}
