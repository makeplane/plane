/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { SearchIcon } from "@plane/propel/icons";
import { cn } from "@plane/utils";

type Props = {
  isActive?: boolean;
};

export function SidebarSearchButton(props: Props) {
  const { isActive } = props;
  return (
    <div
      className={cn(
        "shadow-sm grid aspect-square size-8 flex-shrink-0 place-items-center rounded-md border-[0.5px] border-strong outline-none hover:bg-surface-2",
        {
          "border-accent-strong-200 bg-accent-primary/10 hover:bg-accent-primary/10": isActive,
        }
      )}
    >
      <SearchIcon
        className={cn("size-4 text-tertiary", {
          "text-accent-secondary": isActive,
        })}
      />
    </div>
  );
}
