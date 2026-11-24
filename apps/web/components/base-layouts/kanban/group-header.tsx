/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { IGroupHeaderProps } from "@plane/types";

export function GroupHeader({ group, itemCount, onToggleGroup }: IGroupHeaderProps) {
  return (
    <button
      type="button"
      onClick={() => onToggleGroup(group.id)}
      className="relative flex w-full flex-shrink-0 flex-row items-center gap-1 py-1.5 text-left text-body-xs-medium text-secondary"
    >
      {group.icon ? (
        <span className="flex size-5 flex-shrink-0 items-center justify-center overflow-hidden rounded-xs">
          {group.icon}
        </span>
      ) : null}
      <span className="relative flex w-full flex-row items-baseline gap-1 overflow-hidden">
        <span className="line-clamp-1 inline-block truncate overflow-hidden text-primary">{group.name}</span>
        <span className="flex-shrink-0 pl-2 text-body-xs-medium text-tertiary">{itemCount}</span>
      </span>
    </button>
  );
}
