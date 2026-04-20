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

import type { MutableRefObject } from "react";
import { useRef, useState } from "react";
import type { LucideIcon } from "lucide-react";
// plane imports
import { useOutsideClickDetector } from "@plane/hooks";
import { useTranslation } from "@plane/i18n";
import { EditIcon, TrashIcon } from "@plane/propel/icons";
import type { ISvgIcons } from "@plane/propel/icons";
import type { ReleaseLabel } from "@plane/types";
import { CustomMenu, DragHandle } from "@plane/ui";
import { cn } from "@plane/utils";
// local
import { ReleaseLabelName } from "./label-name";

export interface IReleaseLabelCustomMenuItem {
  CustomIcon: LucideIcon | React.FC<ISvgIcons>;
  onClick: (label: ReleaseLabel) => void;
  isVisible: boolean;
  text: string;
  key: string;
}

type Props = {
  label: ReleaseLabel;
  isDragging: boolean;
  handleEdit: (label: ReleaseLabel) => void;
  handleDelete: (label: ReleaseLabel) => void;
  dragHandleRef: MutableRefObject<HTMLButtonElement | null>;
  permissions: {
    canEdit: boolean;
    canDelete: boolean;
    canReorder: boolean;
  };
};

export function ReleaseLabelBlock({ label, isDragging, handleEdit, handleDelete, dragHandleRef, permissions }: Props) {
  const [isMenuActive, setIsMenuActive] = useState(false);
  const actionSectionRef = useRef<HTMLDivElement | null>(null);
  const { t } = useTranslation();

  useOutsideClickDetector(actionSectionRef, () => setIsMenuActive(false));

  const menuItems: IReleaseLabelCustomMenuItem[] = [
    {
      CustomIcon: EditIcon,
      onClick: handleEdit,
      isVisible: permissions.canEdit,
      text: t("releases.settings.labels.actions.edit"),
      key: "edit_label",
    },
    {
      CustomIcon: TrashIcon,
      onClick: handleDelete,
      isVisible: permissions.canDelete,
      text: t("releases.settings.labels.actions.delete"),
      key: "delete_label",
    },
  ];

  const isAnyPermissionAvailable = permissions.canDelete || permissions.canEdit || permissions.canReorder;

  return (
    <div className="group flex items-center relative">
      <div className="flex items-center">
        {permissions.canReorder && (
          <DragHandle
            className={cn("opacity-0 group-hover:opacity-100", { "opacity-100": isDragging })}
            ref={dragHandleRef}
            aria-label={t("releases.settings.labels.drag_to_reorder")}
          />
        )}
        <ReleaseLabelName color={label.color} name={label.name} />
      </div>

      {isAnyPermissionAvailable && (
        <div
          ref={actionSectionRef}
          className={cn("absolute right-2.5 flex items-center gap-2", {
            "opacity-100": isMenuActive,
            "opacity-0 group-hover:pointer-events-auto group-hover:opacity-100": !isMenuActive,
          })}
        >
          {permissions.canEdit && (
            <div className="py-0.5">
              <button
                className="flex size-5 items-center justify-center rounded-sm hover:bg-layer-1"
                onClick={() => handleEdit(label)}
              >
                <EditIcon className="size-3.5 flex-shrink-0 text-tertiary" />
              </button>
            </div>
          )}
          <CustomMenu ellipsis menuButtonOnClick={() => setIsMenuActive(!isMenuActive)} useCaptureForOutsideClick>
            {menuItems.map(
              ({ isVisible, onClick, CustomIcon, text, key }) =>
                isVisible && (
                  <CustomMenu.MenuItem key={key} onClick={() => onClick(label)}>
                    <span className="flex items-center justify-start gap-2">
                      <CustomIcon className="size-4" />
                      <span>{text}</span>
                    </span>
                  </CustomMenu.MenuItem>
                )
            )}
          </CustomMenu>
        </div>
      )}
    </div>
  );
}
