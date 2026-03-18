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
import { ImportIcon } from "@plane/propel/icons";
// local imports
import { WorkItemTypesSettingsListHeader } from "../types-list-header";
import { WorkItemTypeListRoot } from "../list";
import type { LinkedPropertyData } from "../linked-properties";
import { ImportWorkItemTypesModal } from "./import-types-modal";
// hooks
import { useProjectWorkItemTypes } from "@/plane-web/hooks/store/work-item-types/use-project-work-item-types";
import { useWorkspaceWorkItemTypes } from "@/plane-web/hooks/store/work-item-types/use-workspace-work-item-types";
import { useWorkspaceCustomProperties } from "@/plane-web/hooks/store/custom-properties/use-workspace-custom-properties";
import { useCustomProperty } from "@/plane-web/hooks/store/custom-properties/use-custom-property";

type Props = {
  workspaceSlug: string;
  projectId: string;
};

export const ProjectWorkItemTypesTypesTabContent = observer(function ProjectWorkItemTypesTypesTabContent(props: Props) {
  // props
  const { workspaceSlug, projectId } = props;
  // states
  const [isImportTypesModalOpen, setIsImportTypesModalOpen] = useState(false);
  // plane hooks
  const { t } = useTranslation();
  // hooks
  const { getWorkItemTypesByProjectId, getLoaderByProjectId, importGlobalTypes } = useProjectWorkItemTypes();
  const { getWorkItemTypesByWorkspaceSlug, getLoaderByWorkspaceSlug } = useWorkspaceWorkItemTypes();
  const { getPropertiesByWorkspaceSlug } = useWorkspaceCustomProperties();
  const { getCustomPropertiesByIds } = useCustomProperty();
  // derived values
  const projectWorkItemTypes = getWorkItemTypesByProjectId(projectId);
  const workspaceWorkItemTypes = getWorkItemTypesByWorkspaceSlug(workspaceSlug);
  const isInitializing =
    getLoaderByProjectId(projectId) === "init-loader" || getLoaderByWorkspaceSlug(workspaceSlug) === "init-loader";
  const importedIds = new Set(projectWorkItemTypes.map((type) => type.id));
  const importableTypes = workspaceWorkItemTypes.filter((type) => !importedIds.has(type.id));

  const availableProperties: LinkedPropertyData[] = getPropertiesByWorkspaceSlug(workspaceSlug).map((p) => p.asJSON);

  // Resolve linked properties by IDs
  const getLinkedProperties = useCallback(
    (propertyIds: string[]): LinkedPropertyData[] => getCustomPropertiesByIds(propertyIds).map((p) => p.asJSON),
    [getCustomPropertiesByIds]
  );

  // handlers
  const handleImport = async (typeIds: string[]) => {
    await importGlobalTypes({ workspaceSlug, projectId, typeIds });
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h6 className="text-h6-medium">{t("work_item_types.settings.types.title")}</h6>
        <p className="text-body-xs-regular text-secondary">{t("work_item_types.settings.types.description")}</p>
      </div>
      {/* Filters header */}
      <WorkItemTypesSettingsListHeader
        count={projectWorkItemTypes.length}
        actionButton={
          <Button
            size="lg"
            prependIcon={<ImportIcon className="size-4" />}
            onClick={() => setIsImportTypesModalOpen(true)}
          >
            {t("work_item_types.settings.types.project.add_button.import_from_workspace")}
          </Button>
        }
      />
      {/* List */}
      <WorkItemTypeListRoot
        workItemTypes={projectWorkItemTypes}
        availableProperties={availableProperties}
        getLinkedProperties={getLinkedProperties}
        isInitializing={isInitializing}
        actions={{
          edit: () => {},
          delete: () => Promise.resolve(),
        }}
      />
      {/* Modals */}
      <ImportWorkItemTypesModal
        isOpen={isImportTypesModalOpen}
        onClose={() => setIsImportTypesModalOpen(false)}
        onImport={handleImport}
        importableTypes={importableTypes}
      />
    </div>
  );
});
