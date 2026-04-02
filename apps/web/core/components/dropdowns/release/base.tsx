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

import { useMemo, useRef, useState } from "react";
import { observer } from "mobx-react";
import { usePopper } from "react-popper";
import { Combobox } from "@headlessui/react";
import { CheckIcon, SearchIcon, ReleaseIcon } from "@plane/propel/icons";
import { useTranslation } from "@plane/i18n";
import { ComboDropDown } from "@plane/ui";
import { cn } from "@plane/utils";
import { useDropdown } from "@/hooks/use-dropdown";
import { DropdownButton } from "../buttons";
import { BUTTON_VARIANTS_WITHOUT_TEXT } from "../constants";
import type { TReleaseDropdownBaseProps } from "./types";
import { ReleaseButtonContent } from "./button-content";

export const ReleaseDropdownBase = observer(function ReleaseDropdownBase(props: TReleaseDropdownBaseProps) {
  const {
    button,
    buttonClassName,
    buttonContainerClassName,
    buttonVariant,
    className = "",
    disabled = false,
    dropdownArrow = false,
    dropdownArrowClassName = "",
    emptyLabel,
    hideIcon = false,
    onChange,
    onClose,
    placeholder,
    placement,
    releases,
    renderByDefault = true,
    showCount = false,
    showTooltip = false,
    tabIndex,
    value,
  } = props;

  const { t } = useTranslation();

  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");

  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [referenceElement, setReferenceElement] = useState<HTMLButtonElement | null>(null);
  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(null);

  const { styles, attributes } = usePopper(referenceElement, popperElement, {
    placement: placement ?? "bottom-start",
    modifiers: [
      {
        name: "preventOverflow",
        options: {
          padding: 12,
        },
      },
    ],
  });

  const { handleKeyDown, handleOnClick, searchInputKeyDown } = useDropdown({
    dropdownRef,
    inputRef,
    isOpen,
    onClose,
    query,
    setIsOpen,
    setQuery,
  });

  const filteredReleases = useMemo(
    () =>
      query === "" ? releases : releases.filter((release) => release.name.toLowerCase().includes(query.toLowerCase())),
    [query, releases]
  );

  const getReleaseById = (id: string) => releases.find((r) => r.id === id);

  const tooltipContent = useMemo(() => {
    if (value.length === 0) return emptyLabel ?? t("releases.no_release");
    if (value.length === 1) return getReleaseById(value[0])?.name ?? t("releases.label", { count: 1 });
    return t("releases.count_releases", { count: value.length });
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [emptyLabel, releases, t, value]);

  const dropdownOnChange = (val: string[]) => {
    onChange(val);
  };

  const comboButton = (
    <>
      {button ? (
        <button
          ref={setReferenceElement}
          type="button"
          className={cn("clickable block h-full w-full outline-none hover:bg-layer-1", buttonContainerClassName)}
          onClick={handleOnClick}
          disabled={disabled}
          tabIndex={tabIndex}
        >
          {button}
        </button>
      ) : (
        <button
          ref={setReferenceElement}
          type="button"
          className={cn(
            "clickable block h-full max-w-full outline-none hover:bg-layer-1",
            {
              "cursor-not-allowed text-secondary": disabled,
              "cursor-pointer": !disabled,
            },
            buttonContainerClassName
          )}
          onClick={handleOnClick}
          disabled={disabled}
          tabIndex={tabIndex}
        >
          <DropdownButton
            className={buttonClassName}
            isActive={isOpen}
            tooltipHeading={t("releases.label", { count: 1 })}
            tooltipContent={tooltipContent}
            showTooltip={showTooltip}
            variant={buttonVariant}
            renderToolTipByDefault={renderByDefault}
          >
            <ReleaseButtonContent
              disabled={disabled}
              dropdownArrow={dropdownArrow}
              dropdownArrowClassName={dropdownArrowClassName}
              hideIcon={hideIcon}
              hideText={BUTTON_VARIANTS_WITHOUT_TEXT.includes(buttonVariant)}
              placeholder={placeholder ?? emptyLabel ?? t("releases.no_release")}
              showCount={showCount}
              value={value}
              getReleaseById={getReleaseById}
            />
          </DropdownButton>
        </button>
      )}
    </>
  );

  return (
    <ComboDropDown
      as="div"
      ref={dropdownRef}
      className={cn("h-full", className)}
      value={value}
      onChange={dropdownOnChange}
      disabled={disabled}
      onKeyDown={handleKeyDown}
      button={comboButton}
      renderByDefault={renderByDefault}
      multiple
    >
      {isOpen && (
        <Combobox.Options className="fixed z-10" static>
          <div
            className="my-1 w-52 rounded-sm border-[0.5px] border-strong bg-surface-1 px-2 py-2.5 text-11 shadow-raised-200 focus:outline-none"
            ref={setPopperElement}
            style={styles.popper}
            {...attributes.popper}
          >
            <div className="flex items-center gap-1.5 rounded-sm border border-subtle bg-surface-2 px-2">
              <SearchIcon className="h-3.5 w-3.5 text-placeholder" strokeWidth={1.5} />
              <Combobox.Input
                as="input"
                ref={inputRef}
                className="w-full bg-transparent py-1 text-11 text-secondary placeholder:text-placeholder focus:outline-none"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("common.search.placeholder")}
                displayValue={(assigned: unknown) => (assigned as { name?: string })?.name ?? ""}
                onKeyDown={searchInputKeyDown}
              />
            </div>
            <div className="mt-2 max-h-48 space-y-1 overflow-y-scroll">
              {filteredReleases.length > 0 ? (
                filteredReleases.map((release) => (
                  <Combobox.Option
                    key={release.id}
                    value={release.id}
                    className={({ active, selected }) =>
                      cn(
                        "flex w-full cursor-pointer select-none items-center justify-between gap-2 truncate rounded-sm px-1 py-1.5",
                        {
                          "bg-layer-transparent-hover": active,
                          "text-primary": selected,
                          "text-secondary": !selected,
                        }
                      )
                    }
                  >
                    {({ selected }) => (
                      <>
                        <div className="flex items-center gap-2 truncate">
                          <ReleaseIcon className="h-3 w-3 shrink-0" />
                          <span className="grow truncate">{release.name}</span>
                        </div>
                        {selected && <CheckIcon className="h-3.5 w-3.5 shrink-0" />}
                      </>
                    )}
                  </Combobox.Option>
                ))
              ) : (
                <p className="px-1.5 py-1 italic text-placeholder">{t("no_matching_results")}</p>
              )}
            </div>
          </div>
        </Combobox.Options>
      )}
    </ComboDropDown>
  );
});
