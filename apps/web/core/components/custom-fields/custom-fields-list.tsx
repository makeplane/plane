/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
// plane imports
import type { ECustomFieldEntityType, TCustomField } from "@plane/types";
// hooks
import { useCustomField } from "@/hooks/store/use-custom-field";
// local imports
import { CustomFieldsListItem } from "./custom-fields-list-item";

type Props = {
  workspaceSlug: string;
  entityType: ECustomFieldEntityType;
  fields: TCustomField[];
  onEdit: (field: TCustomField) => void;
  onDelete: (field: TCustomField) => void;
};

export const CustomFieldsList = observer(function CustomFieldsList(props: Props) {
  const { workspaceSlug, entityType, fields, onEdit, onDelete } = props;
  const { updateCustomField } = useCustomField();

  const handleMove = async (field: TCustomField, direction: "up" | "down") => {
    const index = fields.findIndex((f) => f.id === field.id);
    const neighborIndex = direction === "up" ? index - 1 : index + 1;
    const neighbor = fields[neighborIndex];
    if (!neighbor) return;
    // swap sort orders
    await Promise.all([
      updateCustomField(workspaceSlug, entityType, field.id, { sort_order: neighbor.sort_order }),
      updateCustomField(workspaceSlug, entityType, neighbor.id, { sort_order: field.sort_order }),
    ]);
  };

  return (
    <div className="rounded-lg border border-subtle bg-surface-1">
      {fields.map((field, index) => (
        <CustomFieldsListItem
          key={field.id}
          field={field}
          isFirst={index === 0}
          isLast={index === fields.length - 1}
          onEdit={onEdit}
          onDelete={onDelete}
          onMove={handleMove}
        />
      ))}
    </div>
  );
});
