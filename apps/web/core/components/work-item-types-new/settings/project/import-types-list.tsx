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
// plane imports
import type { BaseWorkItemTypeInstanceSchema } from "@plane/types";
import { EmptyStateCompact } from "@plane/propel/empty-state";
// local imports
import { ImportTypesListItem } from "./import-types-list-item";

type ImportTypesListProps = {
  workItemTypes: BaseWorkItemTypeInstanceSchema[];
  selectedTypeIds: Set<string>;
  onToggle: (typeId: string) => void;
};

export const ImportTypesList = observer(function ImportTypesList(props: ImportTypesListProps) {
  const { workItemTypes, selectedTypeIds, onToggle } = props;

  if (!workItemTypes.length) {
    return (
      <div className="py-6">
        <EmptyStateCompact title="No work item types available" description="There are no workspace types to import." />
      </div>
    );
  }

  return (
    <div className="max-h-96 overflow-y-auto space-y-2">
      {workItemTypes.map((workItemType) => (
        <ImportTypesListItem
          key={workItemType.id}
          workItemType={workItemType}
          isSelected={selectedTypeIds.has(workItemType.id)}
          onToggle={onToggle}
        />
      ))}
    </div>
  );
});
