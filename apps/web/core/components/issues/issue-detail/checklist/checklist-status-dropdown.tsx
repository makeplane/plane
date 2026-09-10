/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React from "react";
// plane imports
import { StateGroupIcon } from "@plane/propel/icons";
import { ChevronDownOutline } from "@makeplane/propel/icons";
import { CHECKLIST_ITEM_STATUSES, CHECKLIST_ITEM_STATUS_MAP, STATE_GROUPS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { CustomSelect } from "@plane/ui";
import { cn } from "@plane/utils";
import type { EChecklistItemStatus } from "@plane/types";

type Props = {
  value: EChecklistItemStatus;
  onChange: (value: EChecklistItemStatus) => void;
  disabled?: boolean;
};

// Sits at the end of the row as a colored pill (tinted background + text in
// the status's STATE_GROUPS color, same `${color}20` convention used for
// cycle/label chips elsewhere) so the status reads at a glance without
// relying on icon shape alone. All four values reuse
// StateGroupIcon/STATE_GROUPS purely for rendering; the database stores its
// own to_do/in_progress/skipped/done vocabulary (see
// packages/constants/src/checklist.ts).
export function ChecklistStatusDropdown(props: Props) {
  const { value, onChange, disabled = false } = props;
  const { t } = useTranslation();
  // Falls back to the first known status (to_do) if the server ever returns
  // a status value this client's enum doesn't know about, so an older
  // client degrades gracefully instead of crashing on a stale build.
  const current = CHECKLIST_ITEM_STATUS_MAP[value] ?? CHECKLIST_ITEM_STATUSES[0];
  const color = STATE_GROUPS[current.stateGroup].color;

  return (
    <CustomSelect
      value={value}
      onChange={onChange}
      disabled={disabled}
      customButton={
        <span
          className="flex items-center gap-1 rounded-full px-2 py-0.5 text-12 font-medium"
          style={{ color, backgroundColor: `${color}20` }}
        >
          <StateGroupIcon stateGroup={current.stateGroup} className="h-3 w-3" color={color} />
          {t(current.i18n_label)}
          {!disabled && <ChevronDownOutline className="h-2.5 w-2.5" aria-hidden="true" />}
        </span>
      }
      customButtonClassName={cn("flex-shrink-0 rounded-full", disabled ? "" : "hover:opacity-80")}
    >
      {CHECKLIST_ITEM_STATUSES.map((status) => (
        <CustomSelect.Option key={status.key} value={status.key}>
          <span className="flex items-center gap-2">
            <StateGroupIcon
              stateGroup={status.stateGroup}
              className="h-3 w-3"
              color={STATE_GROUPS[status.stateGroup].color}
            />
            {t(status.i18n_label)}
          </span>
        </CustomSelect.Option>
      ))}
    </CustomSelect>
  );
}
