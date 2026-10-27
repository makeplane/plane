/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React from "react";
// plane imports
import { TickOutline } from "@makeplane/propel/icons";

type Props = {
  icon?: React.ReactNode;
  isChecked: boolean;
  title: React.ReactNode;
  onClick?: () => void;
  multiple?: boolean;
};

export function FilterOption(props: Props) {
  const { icon, isChecked, multiple = true, onClick, title } = props;

  return (
    <button
      type="button"
      className="flex w-full items-center gap-2 rounded-sm p-1.5 text-start outline-none hover:bg-layer-transparent-hover focus-visible:ring-2 focus-visible:ring-accent-strong focus-visible:ring-inset"
      aria-pressed={isChecked}
      onClick={onClick}
    >
      <div
        className={`grid h-3 w-3 shrink-0 place-items-center border ${
          isChecked ? "border-accent-strong bg-accent-primary text-on-color" : "border-strong"
        } ${multiple ? "rounded-xs" : "rounded-full"}`}
      >
        {isChecked && <TickOutline width={10} height={10} />}
      </div>
      <div className="flex items-center gap-2 truncate">
        {icon && <div className="grid w-5 shrink-0 place-items-center">{icon}</div>}
        <div className="grow truncate text-caption-sm-regular text-secondary">{title}</div>
      </div>
    </button>
  );
}
