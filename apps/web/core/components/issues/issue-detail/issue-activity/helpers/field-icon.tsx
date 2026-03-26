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

import { Network, RotateCcw } from "lucide-react";
import { ArchiveIcon, WorkItemsIcon } from "@plane/propel/icons";
import { DEFAULT_FIELD_ICON_MAP } from "./field-icon-map";

const ICON_CLASS = "h-3.5 w-3.5 text-secondary";

/**
 * Resolves the appropriate icon for an activity field.
 */
export function FieldIcon({ field, newValue }: { field: string | null; newValue?: string }) {
  switch (field) {
    case null:
      return <WorkItemsIcon width={14} height={14} className="text-secondary" />;
    case "archived_at":
      return newValue === "restore" ? <RotateCcw className={ICON_CLASS} /> : <ArchiveIcon className={ICON_CLASS} />;
    default:
      return field in DEFAULT_FIELD_ICON_MAP ? (
        DEFAULT_FIELD_ICON_MAP[field as keyof typeof DEFAULT_FIELD_ICON_MAP]
      ) : (
        <Network className={ICON_CLASS} />
      );
  }
}
