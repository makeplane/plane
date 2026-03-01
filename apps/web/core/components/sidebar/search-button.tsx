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
        "flex-shrink-0 size-8 aspect-square grid place-items-center rounded-md shadow-raised-100 hover:bg-surface-2 outline-none border border-strong",
        {
          "bg-accent-primary/10 hover:bg-accent-primary/10 border-accent-strong-200": isActive,
        }
      )}
    >
      <SearchIcon
        className={cn("size-4 text-secondary", {
          "text-accent-secondary": isActive,
        })}
      />
    </div>
  );
}
