/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { ChevronDown, ChevronUp, Lock, Pencil, Trash2 } from "lucide-react";
// plane imports
import { CUSTOM_FIELD_TYPE_CONFIG_MAP } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import type { TCustomField } from "@plane/types";
import { cn } from "@plane/utils";
// local imports
import { FieldTypeIcon } from "./field-type-icon";

type Props = {
  field: TCustomField;
  isFirst: boolean;
  isLast: boolean;
  onEdit: (field: TCustomField) => void;
  onDelete: (field: TCustomField) => void;
  onMove: (field: TCustomField, direction: "up" | "down") => void;
};

export function CustomFieldsListItem(props: Props) {
  const { field, isFirst, isLast, onEdit, onDelete, onMove } = props;
  const { t } = useTranslation();
  const typeLabel = CUSTOM_FIELD_TYPE_CONFIG_MAP[field.field_type]?.i18n_label;

  return (
    <div
      className={cn("flex items-center gap-3 border-b border-subtle px-3 py-2.5 last:border-b-0", {
        "opacity-60": !field.is_active,
      })}
    >
      {/* reorder */}
      <div className="flex flex-col">
        <button
          type="button"
          disabled={isFirst}
          onClick={() => onMove(field, "up")}
          className="grid size-4 place-items-center text-tertiary hover:text-primary disabled:opacity-30"
        >
          <ChevronUp className="size-3.5" />
        </button>
        <button
          type="button"
          disabled={isLast}
          onClick={() => onMove(field, "down")}
          className="grid size-4 place-items-center text-tertiary hover:text-primary disabled:opacity-30"
        >
          <ChevronDown className="size-3.5" />
        </button>
      </div>

      <span className="grid size-7 shrink-0 place-items-center rounded-md bg-surface-2 text-tertiary">
        <FieldTypeIcon type={field.field_type} className="size-4" />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-body-sm-medium text-primary">{field.display_name}</span>
          {field.is_required && (
            <span className="rounded bg-danger-subtle px-1.5 py-0.5 text-10 font-medium text-danger-primary">
              {t("workspace_settings.settings.custom_fields.list.required")}
            </span>
          )}
          {field.admin_only && (
            <span className="flex items-center gap-1 rounded bg-surface-2 px-1.5 py-0.5 text-10 font-medium text-tertiary">
              <Lock className="size-2.5" />
              {t("workspace_settings.settings.custom_fields.list.admin_only")}
            </span>
          )}
          {!field.is_active && (
            <span className="rounded bg-surface-2 px-1.5 py-0.5 text-10 font-medium text-tertiary">
              {t("workspace_settings.settings.custom_fields.list.inactive")}
            </span>
          )}
        </div>
        <div className="mt-0.5 flex items-center gap-2 text-11 text-tertiary">
          <span>{typeLabel ? t(typeLabel) : field.field_type}</span>
          <span>·</span>
          <span>{t("workspace_settings.settings.custom_fields.list.width", { width: field.width })}</span>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onEdit(field)}
          className="grid size-7 place-items-center rounded-md text-tertiary hover:bg-layer-1 hover:text-primary"
        >
          <Pencil className="size-4" />
        </button>
        <button
          type="button"
          onClick={() => onDelete(field)}
          className="grid size-7 place-items-center rounded-md text-tertiary hover:bg-layer-1 hover:text-danger-primary"
        >
          <Trash2 className="size-4" />
        </button>
      </div>
    </div>
  );
}
