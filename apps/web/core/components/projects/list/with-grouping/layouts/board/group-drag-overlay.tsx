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

import { AlertCircle } from "lucide-react";
import { ISSUE_ORDER_BY_OPTIONS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import type { TIssueOrderByOptions } from "@plane/types";
import { cn } from "@plane/utils";

type Props = {
  dragColumnOrientation: "justify-start" | "justify-center" | "justify-end";
  canOverlayBeVisible: boolean;
  isDropDisabled: boolean;
  dropErrorMessage?: string;
  orderBy?: TIssueOrderByOptions | undefined;
  isDraggingOverColumn: boolean;
};

export function GroupDragOverlay(props: Props) {
  const {
    dragColumnOrientation,
    canOverlayBeVisible,
    isDropDisabled,
    dropErrorMessage,
    orderBy,
    isDraggingOverColumn,
  } = props;
  const { t } = useTranslation();

  const shouldOverlayBeVisible = isDraggingOverColumn && canOverlayBeVisible;
  const readableOrderBy =
    orderBy && ISSUE_ORDER_BY_OPTIONS.find((orderByObj) => orderByObj.key === orderBy)?.titleTranslationKey;

  return (
    <div
      className={cn(
        `absolute top-0 left-0 h-full w-full items-center text-13 font-medium text-tertiary rounded-sm bg-backdrop ${dragColumnOrientation}`,
        {
          "flex flex-col border-[1px] border-subtle-1 z-[2]": shouldOverlayBeVisible,
        },
        { hidden: !shouldOverlayBeVisible }
      )}
    >
      <div
        className={cn(
          "p-3 my-8 flex flex-col rounded-sm items-center",
          {
            "text-secondary": shouldOverlayBeVisible,
          },
          {
            "text-danger-primary": isDropDisabled,
          }
        )}
      >
        {dropErrorMessage ? (
          <div className="flex items-center">
            <AlertCircle width={13} height={13} /> &nbsp;
            <span>{dropErrorMessage}</span>
          </div>
        ) : (
          <>
            {readableOrderBy && (
              <span>
                {t("issue.layouts.ordered_by_label")} <span className="font-semibold">{t(readableOrderBy)}</span>.
              </span>
            )}
            <span>{t("entity.drop_here_to_move", { entity: t("project.label", { count: 2 }) })}</span>
            {/** Count is added for pluralization */}
          </>
        )}
      </div>
    </div>
  );
}
