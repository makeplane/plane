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

// plane imports
import { IconButton } from "@plane/propel/icon-button";
import { SearchIcon, CloseIcon } from "@plane/propel/icons";
import { cn } from "@plane/utils";

type Props = {
  query: string;
  setQuery: (query: string) => void;
};

export function PermissionSearch({ query, setQuery }: Props) {
  return (
    <div className="relative flex items-center">
      <SearchIcon
        className={cn("pointer-events-none absolute left-3 size-4 shrink-0 text-secondary", {
          "text-primary": query,
        })}
      />
      <input
        type="text"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search permissions"
        className="w-full rounded-lg border border-subtle bg-surface-1 py-2 pl-9 pr-8 text-body-sm-regular placeholder:text-tertiary focus:outline-none focus:ring-1 focus:ring-accent-strong"
      />
      {query && (
        <IconButton
          variant="ghost"
          className="absolute right-2 text-secondary hover:text-primary"
          onClick={() => setQuery("")}
          icon={CloseIcon}
        />
      )}
    </div>
  );
}
