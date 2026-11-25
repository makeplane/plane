/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useState } from "react";
// plane imports
import { useTranslation } from "@plane/i18n";
import type { TBoardChanges, TBoardProduct, TBoardState } from "@plane/types";
import { cn } from "@plane/utils";

export type TSave = (
  product: TBoardProduct,
  changes: TBoardChanges,
  shown?: Partial<TBoardProduct>
) => Promise<boolean>;

// After a save the product itself shows the outcome: the new value, or the one the server has when
// the change was refused. The fields follow it and never put back what they remember.
type Props = { product: TBoardProduct; save: TSave; className?: string };

// plain controls: the table may show five hundred rows of them
const controlClassName =
  "h-7 w-full min-w-0 rounded-md border border-transparent bg-transparent px-1.5 text-body-xs-regular text-primary hover:border-subtle focus:border-strong disabled:hover:border-transparent";

export function BoardDateField(props: Props & { field: "start_date" | "target_date" }) {
  const { product, save, field, className } = props;
  const { t } = useTranslation();
  const saved = product[field] ?? "";
  const [value, setValue] = useState(saved);
  useEffect(() => setValue(saved), [saved]);

  const commit = async () => {
    if (value === saved) return;
    if (value) await save(product, { [field]: value });
    else setValue(saved);
  };

  return (
    <input
      type="date"
      aria-label={`${t(field === "start_date" ? "start_date" : "due_date")}: ${product.name}`}
      className={cn(controlClassName, className)}
      value={value}
      min={field === "target_date" ? (product.start_date ?? undefined) : undefined}
      max={field === "start_date" ? (product.target_date ?? undefined) : undefined}
      disabled={!product.can_edit}
      onChange={(event) => setValue(event.target.value)}
      onBlur={() => void commit()}
    />
  );
}

export function BoardStateField(props: Props & { states: TBoardState[] | undefined }) {
  const { product, save, states, className } = props;
  const { t } = useTranslation();

  const handleChange = (id: string) => {
    const state = states?.find((option) => option.id === id);
    if (state) void save(product, { state_id: id }, { state_name: state.name, state_group: state.group });
  };

  if (!product.can_edit || !states)
    return <span className="px-1.5 text-body-xs-regular text-primary">{product.state_name}</span>;

  return (
    <select
      aria-label={`${t("common.state")}: ${product.name}`}
      className={cn(controlClassName, "min-w-32", className)}
      value={product.state_id}
      onChange={(event) => handleChange(event.target.value)}
    >
      {states.map((state) => (
        <option key={state.id} value={state.id}>
          {state.name}
        </option>
      ))}
    </select>
  );
}

export function BoardProgressField(props: Props) {
  const { product, save, className } = props;
  const { t } = useTranslation();
  const saved = product.manual_progress?.toString() ?? "";
  const [value, setValue] = useState(saved);
  useEffect(() => setValue(saved), [saved]);

  const commit = async () => {
    if (value === saved) return;
    const number = value.trim() === "" ? null : Number(value);
    const isValid = number === null || (Number.isInteger(number) && number >= 0 && number <= 100);
    const shown = { progress: number ?? product.calculated_progress };
    if (isValid) await save(product, { manual_progress: number }, shown);
    else setValue(saved);
  };

  return (
    <input
      type="number"
      min={0}
      max={100}
      aria-label={`${t("product.manual_progress")}: ${product.name}`}
      placeholder="—"
      className={cn(controlClassName, className)}
      value={value}
      disabled={!product.can_edit}
      onChange={(event) => setValue(event.target.value)}
      onBlur={() => void commit()}
    />
  );
}

export function BoardCommentField(props: Props) {
  const { product, save, className } = props;
  const { t } = useTranslation();
  const saved = product.status_comment ?? "";
  const [value, setValue] = useState(saved);
  useEffect(() => setValue(saved), [saved]);

  const commit = async () => {
    const text = value.trim();
    if (text === saved) setValue(saved);
    else await save(product, { status_comment: text });
  };

  return (
    <textarea
      rows={1}
      maxLength={500}
      aria-label={`${t("product.status_comment")}: ${product.name}`}
      className={cn(controlClassName, "min-w-48 resize-y py-1", className)}
      value={value}
      disabled={!product.can_edit}
      onChange={(event) => setValue(event.target.value)}
      onBlur={() => void commit()}
    />
  );
}
