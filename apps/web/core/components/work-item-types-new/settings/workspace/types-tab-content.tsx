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

import { useCallback, useState } from "react";
import { observer } from "mobx-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
// local imports
import { WorkItemTypesSettingsListHeader } from "../types-list-header";
import { WorkItemTypeListRoot } from "../list";
import { CreateOrUpdateWorkItemTypeModal } from "../create-update/modal";
import type { LinkedPropertyData } from "../linked-properties";
// hooks
import { useWorkItemType } from "@/plane-web/hooks/store/work-item-types/use-work-item-type";
import { useWorkspaceWorkItemTypes } from "@/plane-web/hooks/store/work-item-types/use-workspace-work-item-types";
import { useWorkspaceCustomProperties } from "@/plane-web/hooks/store/custom-properties/use-workspace-custom-properties";
import { useCustomProperty } from "@/plane-web/hooks/store/custom-properties/use-custom-property";

type Props = {
  workspaceSlug: string;
};

export const WorkspaceWorkItemTypesTypesTabContent = observer(function WorkspaceWorkItemTypesTypesTabContent({
  workspaceSlug,
}: Props) {
  // states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingTypeId, setEditingTypeId] = useState<string | null>(null);
  // hooks
  const { t } = useTranslation();
  const { getWorkItemType } = useWorkItemType();
  const { createType, deleteType, getWorkItemTypesByWorkspaceSlug, getLoaderByWorkspaceSlug, canCreate } =
    useWorkspaceWorkItemTypes();
  const { getPropertiesByWorkspaceSlug } = useWorkspaceCustomProperties();
  const { getCustomPropertiesByIds } = useCustomProperty();

  // derived values
  const workItemTypes = getWorkItemTypesByWorkspaceSlug(workspaceSlug);
  const isInitializing = getLoaderByWorkspaceSlug(workspaceSlug) === "init-loader";
  // editing data
  const editingType = editingTypeId ? getWorkItemType(editingTypeId) : undefined;
  const editingTypeData = editingType?.asJSON;

  const availableProperties: LinkedPropertyData[] = getPropertiesByWorkspaceSlug(workspaceSlug).map((p) => p.asJSON);

  // Resolve linked properties by IDs
  const getLinkedProperties = useCallback(
    (propertyIds: string[]): LinkedPropertyData[] => getCustomPropertiesByIds(propertyIds).map((p) => p.asJSON),
    [getCustomPropertiesByIds]
  );

  // handlers
  const handleModalClose = () => {
    setIsCreateModalOpen(false);
    setEditingTypeId(null);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h6 className="text-h6-medium">{t("work_item_types.settings.types.title")}</h6>
        <p className="text-body-xs-regular text-secondary">{t("work_item_types.settings.types.description")}</p>
      </div>
      {/* Filters header */}
      <WorkItemTypesSettingsListHeader
        count={workItemTypes.length}
        actionButton={
          <Button onClick={() => setIsCreateModalOpen(true)} size="lg">
            {t("work_item_types.create.button")}
          </Button>
        }
      />
      {/* List */}
      <WorkItemTypeListRoot
        workItemTypes={workItemTypes}
        availableProperties={availableProperties}
        getLinkedProperties={getLinkedProperties}
        isInitializing={isInitializing}
        actions={{
          edit: (typeId) => setEditingTypeId(typeId),
          delete: async (typeId) => {
            await deleteType({ workspaceSlug, typeId });
          },
        }}
      />
      {/* Create/Update Modal */}
      <CreateOrUpdateWorkItemTypeModal
        isOpen={isCreateModalOpen || !!editingTypeId}
        onClose={handleModalClose}
        workItemTypeId={editingTypeId ?? undefined}
        workItemTypeData={editingTypeData}
        actions={{
          create: async (data) => {
            await createType({ workspaceSlug, data });
          },
          update: async (typeId, data) => {
            const instance = getWorkItemType(typeId);
            if (!instance) return;
            await instance.updateType(data);
          },
        }}
        permissions={{
          canChangeIcon: canCreate(workspaceSlug),
          canChangeName: canCreate(workspaceSlug),
        }}
      />
    </div>
  );
});
