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
import { observer } from "mobx-react";
import { Search } from "lucide-react";
// plane imports
import { IconButton } from "@plane/propel/icon-button";
import { CloseIcon } from "@plane/propel/icons";
import { cn } from "@plane/utils";

type Props = {
  onChange: (value: string) => void;
  value: string | undefined;
};

export const DashboardsListSearch = observer(function DashboardsListSearch(props: Props) {
  const { onChange, value } = props;
  // states
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  // refs
  const inputRef = useRef<HTMLInputElement>(null);

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      if (value && value.trim() !== "") onChange("");
      else setIsSearchOpen(false);
    }
  };

  return (
    <div className="flex items-center">
      {!isSearchOpen && (
        <IconButton
          variant="ghost"
          size="lg"
          className="-mr-1"
          onClick={() => {
            setIsSearchOpen(true);
            inputRef.current?.focus();
          }}
          icon={Search}
        />
      )}
      <div
        className={cn(
          "ml-auto flex items-center justify-start gap-1 rounded-md border border-transparent bg-layer-2 text-placeholder w-0 transition-[width] ease-linear overflow-hidden opacity-0",
          {
            "w-30 md:w-64 px-2.5 py-1.5 border-subtle-1 opacity-100": isSearchOpen,
          }
        )}
      >
        <Search className="size-3.5" />
        <input
          ref={inputRef}
          className="w-full max-w-[234px] border-none bg-transparent text-caption-md text-primary placeholder:text-placeholder focus:outline-none"
          placeholder="Search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleInputKeyDown}
        />
        {isSearchOpen && (
          <button
            type="button"
            className="grid place-items-center"
            onClick={() => {
              onChange("");
              setIsSearchOpen(false);
            }}
          >
            <CloseIcon className="size-3" />
          </button>
        )}
      </div>
    </div>
  );
});
