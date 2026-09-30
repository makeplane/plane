/**
 * Copyright (c) 2026-present Okręgowa Spółdzielnia Mleczarska w Piątnicy
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { Fragment } from "react";
import { Popover, Transition } from "@headlessui/react";
import { Check } from "lucide-react";

type TProps = {
  value: string;
  onChange: (next: string) => void;
  colors: string[];
};

export const ColorSwatchPicker = ({ value, onChange, colors }: TProps) => (
  <Popover className="relative">
    {({ close }) => (
      <>
        <Popover.Button
          type="button"
          className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md border border-subtle"
          aria-label="Pick color"
        >
          <span className="h-4 w-4 rounded-full border border-subtle" style={{ backgroundColor: value }} />
        </Popover.Button>
        <Transition
          as={Fragment}
          enter="transition ease-out duration-100"
          enterFrom="opacity-0 translate-y-1"
          enterTo="opacity-100 translate-y-0"
          leave="transition ease-in duration-75"
          leaveFrom="opacity-100 translate-y-0"
          leaveTo="opacity-0 translate-y-1"
        >
          <Popover.Panel className="shadow-md absolute top-full left-0 z-30 mt-2 w-fit min-w-[160px] rounded-md border border-subtle bg-surface-1 p-2">
            <div className="grid grid-cols-7 gap-1">
              {colors.map((color) => (
                <button
                  type="button"
                  key={color}
                  className="flex h-5 w-5 items-center justify-center rounded-full border border-subtle"
                  style={{ backgroundColor: color }}
                  onClick={() => {
                    onChange(color);
                    close();
                  }}
                  aria-label={color}
                >
                  {value.toLowerCase() === color.toLowerCase() ? <Check className="h-3 w-3 text-white" /> : null}
                </button>
              ))}
            </div>
          </Popover.Panel>
        </Transition>
      </>
    )}
  </Popover>
);
