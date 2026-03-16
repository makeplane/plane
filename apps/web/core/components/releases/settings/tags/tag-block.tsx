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

import { useRef, useState } from "react";
// plane imports
import { useOutsideClickDetector } from "@plane/hooks";
import { useTranslation } from "@plane/i18n";
import { CloseIcon, EditIcon, TrashIcon } from "@plane/propel/icons";
import type { ReleaseTag } from "@plane/types";
import { CustomMenu } from "@plane/ui";
import { cn } from "@plane/utils";

type Props = {
  tag: ReleaseTag;
  handleEdit: (tag: ReleaseTag) => void;
  handleDelete: (tag: ReleaseTag) => void;
};

export function ReleaseTagBlock({ tag, handleEdit, handleDelete }: Props) {
  const { t } = useTranslation();
  const [isMenuActive, setIsMenuActive] = useState(false);
  const actionSectionRef = useRef<HTMLDivElement | null>(null);

  useOutsideClickDetector(actionSectionRef, () => setIsMenuActive(false));

  return (
    <div className="group flex items-center relative w-full">
      <span className="text-body-sm-medium text-primary font-mono">{tag.version}</span>
      <div
        ref={actionSectionRef}
        className={cn("absolute right-2.5 flex items-center gap-2", {
          "opacity-100": isMenuActive,
          "opacity-0 group-hover:pointer-events-auto group-hover:opacity-100": !isMenuActive,
        })}
      >
        <div className="py-0.5">
          <button
            className="flex size-5 items-center justify-center rounded-sm hover:bg-layer-1"
            onClick={() => handleEdit(tag)}
          >
            <EditIcon className="size-3.5 flex-shrink-0 text-tertiary" />
          </button>
        </div>
        <CustomMenu ellipsis menuButtonOnClick={() => setIsMenuActive(!isMenuActive)} useCaptureForOutsideClick>
          <CustomMenu.MenuItem onClick={() => handleEdit(tag)}>
            <span className="flex items-center justify-start gap-2">
              <EditIcon className="size-4" />
              <span>{t("releases.settings.tags.actions.edit")}</span>
            </span>
          </CustomMenu.MenuItem>
          <CustomMenu.MenuItem onClick={() => handleDelete(tag)}>
            <span className="flex items-center justify-start gap-2">
              <TrashIcon className="size-4" />
              <span>{t("releases.settings.tags.actions.delete")}</span>
            </span>
          </CustomMenu.MenuItem>
        </CustomMenu>
      </div>
    </div>
  );
}
