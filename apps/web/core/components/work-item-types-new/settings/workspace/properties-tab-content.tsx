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

import { useState } from "react";
import { observer } from "mobx-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
// components
import { CustomPropertyCreateUpdateModal } from "@/components/custom-properties/create-update";
import { CustomPropertiesListRoot } from "@/components/custom-properties/list/root";
// local imports
import { WorkItemTypesPropertiesListHeader } from "../properties-list-header";
// hooks
import { useWorkspaceCustomProperties } from "@/plane-web/hooks/store/custom-properties/use-workspace-custom-properties";
import { useCustomProperty } from "@/plane-web/hooks/store/custom-properties/use-custom-property";

type Props = {
  workspaceSlug: string;
};

export const WorkspacePropertiesTabContent = observer(function WorkspacePropertiesTabContent(props: Props) {
  const { workspaceSlug } = props;
  // plane hooks
  const { t } = useTranslation();
  // state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingPropertyId, setEditingPropertyId] = useState<string | null>(null);
  // hooks
  const { getPropertiesByWorkspaceSlug, getLoaderByWorkspaceSlug, createProperty, deleteProperty, canCreate } =
    useWorkspaceCustomProperties();
  const { getCustomProperty } = useCustomProperty();

  // derived values
  const properties = getPropertiesByWorkspaceSlug(workspaceSlug);
  const isInitializing = getLoaderByWorkspaceSlug(workspaceSlug) === "init-loader";
  const editingProperty = editingPropertyId ? getCustomProperty(editingPropertyId) : undefined;

  const handleModalClose = () => {
    setIsCreateModalOpen(false);
    setEditingPropertyId(null);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h6 className="text-h6-medium">{t("work_item_types.settings.properties.title")}</h6>
        <p className="text-body-xs-regular text-secondary">{t("work_item_types.settings.properties.description")}</p>
      </div>
      {/* Filters header */}
      <WorkItemTypesPropertiesListHeader
        count={properties.length}
        actionButton={
          canCreate(workspaceSlug) && (
            <Button size="lg" onClick={() => setIsCreateModalOpen(true)}>
              {t("work_item_types.settings.properties.add_button")}
            </Button>
          )
        }
      />
      {/* List */}
      <CustomPropertiesListRoot
        properties={properties}
        isInitializing={isInitializing}
        actions={{
          edit: (propertyId) => setEditingPropertyId(propertyId),
          delete: async (propertyId) => {
            await deleteProperty({ workspaceSlug, propertyId });
          },
        }}
      />
      {/* Create/Update Modal */}
      <CustomPropertyCreateUpdateModal
        isOpen={isCreateModalOpen || !!editingPropertyId}
        onClose={handleModalClose}
        propertyId={editingPropertyId ?? undefined}
        propertyData={editingProperty?.asJSON}
        actions={{
          create: async (data) => {
            await createProperty({ workspaceSlug, data });
          },
          update: async (propertyId, data) => {
            const property = getCustomProperty(propertyId);
            if (!property) throw new Error(`Property with id ${propertyId} not found`);
            await property.updateProperty(data);
          },
          getSortedActivePropertyOptions: (propertyId) => getCustomProperty(propertyId)?.sortedActivePropertyOptions,
        }}
        permissions={{
          canChangePropertyType: !editingPropertyId,
        }}
      />
    </div>
  );
});
