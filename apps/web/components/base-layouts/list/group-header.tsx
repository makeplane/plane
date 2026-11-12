/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { IGroupHeaderProps } from "@plane/types";

export function GroupHeader({ group, itemCount, onToggleGroup }: IGroupHeaderProps) {
  return (
    <button
      onClick={() => onToggleGroup(group.id)}
      className="flex w-full items-center gap-2 py-2 text-body-xs-medium text-secondary"
    >
      {group.icon}
      <span>{group.name}</span>
      <span className="text-caption-sm-medium text-tertiary">{itemCount}</span>
    </button>
  );
}
