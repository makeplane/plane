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

import { useEffect, useRef, useState } from "react";
import type { Placement } from "@popperjs/core";
import { observer } from "mobx-react";
import { createPortal } from "react-dom";
import { usePopper } from "react-popper";
import { Combobox } from "@headlessui/react";
import { useTranslation } from "@plane/i18n";
import { CheckIcon, CustomersIcon, SearchIcon } from "@plane/propel/icons";
import type { TCustomer } from "@plane/types";
import { cn } from "@plane/utils";
import { SwitcherIcon } from "@/components/common/switcher-label";
import { getCustomerLogoSrc } from "@/components/customers/utils";
import { usePlatformOS } from "@/hooks/use-platform-os";

interface Props {
  customerIds: string[];
  getCustomerById: (customerId: string) => TCustomer | undefined;
  isOpen: boolean;
  optionsClassName?: string;
  placement?: Placement;
  referenceElement: HTMLButtonElement | null;
  value?: string[] | string | null;
}

export const CustomerOptions = observer(function CustomerOptions(props: Props) {
  const { customerIds, getCustomerById, isOpen, optionsClassName = "", placement, referenceElement, value } = props;
  // refs
  const inputRef = useRef<HTMLInputElement | null>(null);
  // states
  const [query, setQuery] = useState("");
  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(null);
  // plane hooks
  const { t } = useTranslation();
  const { isMobile } = usePlatformOS();
  // popper-js init
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

  useEffect(() => {
    if (isOpen && !isMobile) {
      inputRef.current && inputRef.current.focus();
    }
  }, [isOpen, isMobile]);

  const searchInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (query !== "" && e.key === "Escape") {
      e.stopPropagation();
      setQuery("");
    }
  };

  const options = customerIds
    .map((customerId) => {
      const customer = getCustomerById(customerId);
      if (!customer) return null;
      return {
        value: customerId,
        query: customer.name ?? "",
        content: (
          <div className="flex items-center gap-2">
            <SwitcherIcon logo_url={getCustomerLogoSrc(customer)} LabelIcon={CustomersIcon} />
            <span className="flex-grow truncate">{customer.name}</span>
          </div>
        ),
      };
    })
    .filter((o): o is NonNullable<typeof o> => !!o);

  const filteredOptions =
    query === "" ? options : options.filter((o) => o.query.toLowerCase().includes(query.toLowerCase()));

  return createPortal(
    <Combobox.Options data-prevent-outside-click static>
      <div
        className={cn(
          "my-1 w-48 rounded-sm border-[0.5px] border-strong bg-surface-1 px-2 py-2.5 text-11 shadow-raised-200 focus:outline-none z-30",
          optionsClassName
        )}
        ref={setPopperElement}
        style={{
          ...styles.popper,
        }}
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
            placeholder={t("search")}
            displayValue={(assigned: any) => assigned?.name}
            onKeyDown={searchInputKeyDown}
          />
        </div>
        <div className="mt-2 max-h-48 space-y-1 overflow-y-scroll">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option) => (
              <Combobox.Option
                key={option.value}
                value={option.value}
                className={({ active, selected }) =>
                  cn(
                    "flex w-full cursor-pointer select-none items-center justify-between gap-2 truncate rounded-sm px-1 py-1.5",
                    active && "bg-layer-transparent-hover",
                    selected ? "text-primary" : "text-secondary"
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
            <p className="px-1.5 py-1 italic text-placeholder">{t("no_matching_results")}</p>
          )}
        </div>
      </div>
    </Combobox.Options>,
    document.body
  );
});
