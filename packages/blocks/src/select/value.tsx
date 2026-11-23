/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useSelectContext } from "./context";
import type { SelectValueProps } from "./types";

export function SelectValue<T>({ placeholder, children }: SelectValueProps<T>) {
  const ctx = useSelectContext();

  if (children) return <>{children(ctx.selected as T[])}</>;

  const placeholderText = placeholder ?? ctx.placeholder;

  if (ctx.selected.length === 0) {
    return <span className="truncate text-placeholder">{placeholderText}</span>;
  }

  if (!ctx.multiple) {
    const option = ctx.selected[0];
    // A deprecated hand-drawn row still renders itself. Otherwise the trigger shows the row's icon
    // and label, but not its selection mark: the trigger IS the selection.
    if (ctx.renderOption) return <span className="truncate">{ctx.renderOption(option)}</span>;
    const icon = ctx.getOptionIcon?.(option);
    return icon ? (
      <span className="flex min-w-0 items-center gap-2">
        {icon}
        <span className="truncate">{ctx.getOptionLabel(option)}</span>
      </span>
    ) : (
      <span className="truncate">{ctx.getOptionLabel(option)}</span>
    );
  }

  // Multi-select default: short summary (consumers wanting chips can pass a render-prop child).
  const labels = ctx.selected.map((o) => ctx.getOptionLabel(o));
  const summary = labels.length <= 2 ? labels.join(", ") : `${labels.length} selected`;
  return <span className="truncate">{summary}</span>;
}
