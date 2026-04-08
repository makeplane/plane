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
import { useNavigate } from "react-router";
import { observer } from "mobx-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { AlertIcon, CloseIcon, ExternalLinkIcon, ImportIcon } from "@plane/propel/icons";
import { EUserWorkspaceRoles } from "@plane/types";
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
import { useFlag, useIssueTypes, useWorkspaceFeatures } from "@/plane-web/hooks/store";
import { IconButton } from "@plane/propel/icon-button";
import { useUserPermissions } from "@/hooks/store/user";
import { useWorkspace } from "@/hooks/store/use-workspace";
import { EWorkspaceFeatures } from "@/types/workspace-feature";

type Props = {
  workspaceSlug: string;
  projectId: string;
};

export const ProjectWorkItemTypesTypesTabContent = observer(function ProjectWorkItemTypesTypesTabContent(props: Props) {
  // props
  const { workspaceSlug, projectId } = props;
  // states
  const [isImportTypesModalOpen, setIsImportTypesModalOpen] = useState(false);
  const [isBannerDismissed, setBannerDismissed] = useState(false);
  // plane hooks
  const { t } = useTranslation();
  // hooks
  const { getSortedWorkItemTypesByProjectId, getLoaderByProjectId, importGlobalTypes } = useProjectWorkItemTypes();
  const { getWorkItemTypesByWorkspaceSlug, getLoaderByWorkspaceSlug } = useWorkspaceWorkItemTypes();
  const { getPropertiesByWorkspaceSlug } = useWorkspaceCustomProperties();
  const { getCustomPropertiesByIds } = useCustomProperty();
  const { isWorkspaceFeatureEnabled } = useWorkspaceFeatures();
  const { getWorkspaceRoleByWorkspaceSlug } = useUserPermissions();
  const navigate = useNavigate();
  // derived values
  const isWorkspaceWorkItemTypesEnabled = isWorkspaceFeatureEnabled(EWorkspaceFeatures.IS_WORK_ITEM_TYPES_ENABLED);
  // TODO: update this to RBAC permissions
  const currentWorkspaceRole = getWorkspaceRoleByWorkspaceSlug(workspaceSlug);
  const canAccessWorkspaceWorkItemTypesSettings =
    useFlag(workspaceSlug, "WORKSPACE_WORK_ITEM_TYPES", false) && currentWorkspaceRole === EUserWorkspaceRoles.ADMIN;
  const projectWorkItemTypes = getSortedWorkItemTypesByProjectId(projectId);
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
          isWorkspaceWorkItemTypesEnabled && (
            <Button
              size="lg"
              prependIcon={<ImportIcon className="size-4" />}
              onClick={() => setIsImportTypesModalOpen(true)}
            >
              {t("work_item_types.settings.types.project.add_button.import_from_workspace")}
            </Button>
          )
        }
      />
      {!isBannerDismissed && !isWorkspaceWorkItemTypesEnabled && (
        // TODO-@plane/propel/banner: update this with propel banner component once it is ready
        <div className="rounded-lg py-3 px-4 bg-warning-subtle shadow-raised-200 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <AlertIcon className="size-4 text-warning-primary" />
            <p className="text-body-sm-medium text-warning-primary">
              {t(
                canAccessWorkspaceWorkItemTypesSettings
                  ? "work_item_types.settings.types.project.banner.with_access"
                  : "work_item_types.settings.types.project.banner.without_access"
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {canAccessWorkspaceWorkItemTypesSettings && (
              <Button
                variant="secondary"
                appendIcon={<ExternalLinkIcon className="size-4" />}
                onClick={() => navigate(`/${workspaceSlug}/settings/work-item-types`)}
              >
                Work item types settings
              </Button>
            )}
            <IconButton icon={CloseIcon} variant="ghost" onClick={() => setBannerDismissed(true)} />
          </div>
        </div>
      )}
      {/* List */}
      <WorkItemTypeListRoot
        workItemTypes={projectWorkItemTypes}
        availableProperties={availableProperties}
        getLinkedProperties={getLinkedProperties}
        isInitializing={isInitializing}
        actions={{
          edit: () => {},
          delete: () => Promise.resolve(),
          setDefault: () => Promise.resolve(),
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
