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

import { observer } from "mobx-react";
import { EllipsisVertical, Pencil, Trash2 } from "lucide-react";
// plane imports
import { Badge } from "@plane/propel/badge";
import type { IWorkItemRelationDefinition } from "@plane/types";
import { CustomMenu } from "@plane/ui";
// local imports
import { CreateUpdateRelationInline } from "./create-update-relation-inline";

type Props = {
  workspaceSlug: string;
  definition: IWorkItemRelationDefinition;
  permissions: {
    canEdit: boolean;
    canDelete: boolean;
  };
  isEditing: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onCancelEdit: () => void;
};

export const RelationDefinitionItem = observer(function RelationDefinitionItem(props: Props) {
  const { workspaceSlug, definition, permissions, isEditing, onEdit, onDelete, onCancelEdit } = props;

  if (isEditing) {
    return (
      <CreateUpdateRelationInline
        workspaceSlug={workspaceSlug}
        isUpdating
        definitionToUpdate={definition}
        onClose={onCancelEdit}
      />
    );
  }

  return (
    <div className="flex items-center justify-between rounded-lg border border-subtle bg-layer-2 px-4 py-2 truncate">
      <span className="text-body-xs-medium text-primary truncate">{definition.name}</span>
      <div className="flex items-center gap-2">
        {definition.is_default ? (
          <Badge variant="neutral" size="sm">
            Default
          </Badge>
        ) : permissions.canEdit || permissions.canDelete ? (
          <>
            {permissions.canEdit && (
              <button
                type="button"
                className="flex items-center justify-center size-5 rounded-sm hover:bg-surface-3 text-tertiary"
                onClick={onEdit}
              >
                <Pencil className="size-3.5" />
              </button>
            )}
            {permissions.canDelete && (
              <CustomMenu
                customButton={
                  <button
                    type="button"
                    className="flex items-center justify-center size-5 rounded-sm hover:bg-surface-3 text-tertiary"
                  >
                    <EllipsisVertical className="size-3.5" />
                  </button>
                }
                placement="bottom-end"
                closeOnSelect
              >
                <CustomMenu.MenuItem onClick={onDelete} className="text-danger-primary">
                  <div className="flex items-center gap-2">
                    <Trash2 className="size-3.5" />
                    Delete
                  </div>
                </CustomMenu.MenuItem>
              </CustomMenu>
            )}
          </>
        ) : null}
      </div>
    </div>
  );
});
