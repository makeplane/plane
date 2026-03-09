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

import { Combobox } from "@headlessui/react";
import React, { useEffect, useRef } from "react";
import { SearchIcon } from "@plane/propel/icons";
// helpers
import { cn } from "../../utils";

interface IInputSearch {
  isOpen: boolean;
  query: string;
  updateQuery: (query: string) => void;
  inputIcon?: React.ReactNode;
  inputContainerClassName?: string;
  inputClassName?: string;
  inputPlaceholder?: string;
  isMobile: boolean;
}

export function InputSearch(props: IInputSearch) {
  const { isOpen, query, updateQuery, inputIcon, inputContainerClassName, inputClassName, inputPlaceholder, isMobile } =
    props;

  const inputRef = useRef<HTMLInputElement | null>(null);

  const searchInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (query !== "" && e.key === "Escape") {
      e.stopPropagation();
      updateQuery("");
    }
  };

  useEffect(() => {
    if (isOpen && !isMobile) {
      // oxlint-disable-next-line @typescript-eslint/no-unused-expressions
      inputRef.current && inputRef.current.focus();
    }
  }, [isOpen, isMobile]);

  return (
    <div
      className={cn(
        "flex items-center gap-1.5 rounded-sm border border-subtle bg-surface-2 px-2",
        inputContainerClassName
      )}
    >
      {inputIcon ? <>{inputIcon}</> : <SearchIcon className="h-4 w-4 text-tertiary" aria-hidden="true" />}
      <Combobox.Input
        as="input"
        ref={inputRef}
        className={cn(
          "w-full bg-transparent py-1 text-11 text-secondary placeholder:text-placeholder focus:outline-none",
          inputClassName
        )}
        value={query}
        onChange={(e) => updateQuery(e.target.value)}
        placeholder={inputPlaceholder ?? "Search"}
        onKeyDown={searchInputKeyDown}
      />
    </div>
  );
}
