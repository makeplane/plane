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

import type { FC } from "react";
import { memo } from "react";
import { Checkbox } from "@plane/ui";
import type { TChecklistItem } from "../constant";

type ChecklistItemProps = {
  readonly item: TChecklistItem;
  readonly isChecked: boolean;
  readonly onClick?: () => void;
};

export const ChecklistItem: FC<ChecklistItemProps> = memo(function ChecklistItem({ item, isChecked, onClick }) {
  return (
    <div className="not-last:border-b not-last:border-subtle" role="listitem">
      <button
        type="button"
        className="flex items-center justify-between py-3.5 px-3 cursor-pointer hover:bg-layer-3 transition-colors w-full text-left"
        onClick={onClick}
      >
        <span className="flex items-center gap-3 pointer-events-none">
          <Checkbox checked={isChecked} aria-label={item.label} />
          <span className="text-body-sm-regular">{item.label}</span>
        </span>
      </button>
    </div>
  );
});
