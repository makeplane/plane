/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { RefObject } from "react";
import { Combobox } from "@headlessui/react";
import { ISSUE_FREQUENCIES } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { CheckIcon, SearchIcon } from "@plane/propel/icons";
import { cn } from "@plane/utils";

type Props = {
  query: string;
  onQueryChange: (q: string) => void;
  inputRef: RefObject<HTMLInputElement>;
  onKeyDown: React.KeyboardEventHandler<HTMLInputElement>;
  popperRef: (el: HTMLDivElement | null) => void;
  popperStyle: React.CSSProperties;
  popperAttributes: Record<string, unknown>;
};

export function FrequencyOptionsPanel(props: Props) {
  const { query, onQueryChange, inputRef, onKeyDown, popperRef, popperStyle, popperAttributes } = props;
  const { t } = useTranslation();

  const options = ISSUE_FREQUENCIES.map((freq) => ({
    value: freq.key,
    query: freq.title.toLowerCase(),
    content: (
      <div className="flex items-center gap-2">
        <span className="size-2 rounded-full flex-shrink-0" style={{ backgroundColor: freq.color }} />
        <span className="flex-grow truncate">{freq.title}</span>
      </div>
    ),
  }));

  const filteredOptions = query === "" ? options : options.filter((o) => o.query.includes(query.toLowerCase()));

  return (
    <Combobox.Options className="fixed z-10" static>
      <div
        className="my-1 w-48 rounded-sm border-[0.5px] border-strong bg-surface-1 px-2 py-2.5 text-11 shadow-raised-200 focus:outline-none"
        ref={popperRef}
        style={popperStyle}
        {...popperAttributes}
      >
        <div className="flex items-center gap-1.5 rounded-sm border border-subtle bg-surface-2 px-2">
          <SearchIcon className="h-3.5 w-3.5 text-placeholder" strokeWidth={1.5} />
          <Combobox.Input
            as="input"
            ref={inputRef}
            className="w-full bg-transparent py-1 text-11 text-secondary placeholder:text-placeholder focus:outline-none"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder={t("search")}
            displayValue={(assigned: unknown) => (assigned as { name?: string })?.name ?? ""}
            onKeyDown={onKeyDown}
          />
        </div>
        <div className="mt-2 max-h-48 space-y-1 overflow-y-scroll">
          <Combobox.Option
            value={null}
            className={({ active }) =>
              cn("w-full truncate flex items-center gap-2 rounded-sm px-1 py-1.5 cursor-pointer select-none", {
                "bg-layer-transparent-hover": active,
              })
            }
          >
            {({ selected }) => (
              <>
                <span className="flex-grow truncate text-placeholder italic">{t("common.none")}</span>
                {selected && <CheckIcon className="h-3.5 w-3.5 flex-shrink-0" />}
              </>
            )}
          </Combobox.Option>
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option) => (
              <Combobox.Option
                key={option.value}
                value={option.value}
                className={({ active, selected }) =>
                  cn(
                    "w-full truncate flex items-center justify-between gap-2 rounded-sm px-1 py-1.5 cursor-pointer select-none",
                    { "bg-layer-transparent-hover": active, "text-primary": selected, "text-secondary": !selected }
                  )
                }
              >
                {({ selected }) => (
                  <>
                    <span className="flex-grow truncate">{option.content}</span>
                    {selected && <CheckIcon className="h-3.5 w-3.5 flex-shrink-0" />}
                  </>
                )}
              </Combobox.Option>
            ))
          ) : (
            <p className="text-placeholder italic py-1 px-1.5">{t("no_matching_results")}</p>
          )}
        </div>
      </div>
    </Combobox.Options>
  );
}
