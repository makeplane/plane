/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "react-router";
import useSWR from "swr";
// plane imports
import { EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import type { ECustomFieldEntityType, TCustomField } from "@plane/types";
import { Loader } from "@plane/ui";
// components
import { NotAuthorizedView } from "@/components/auth-screens/not-authorized-view";
import { PageHead } from "@/components/core/page-title";
import {
  CreateUpdateFieldModal,
  CustomFieldsEmptyState,
  CustomFieldsList,
  DeleteFieldModal,
} from "@/components/custom-fields";
import { SettingsHeading } from "@/components/settings/heading";
// hooks
import { useCustomField } from "@/hooks/store/use-custom-field";
import { useUserPermissions } from "@/hooks/store/user";
import { useWorkspace } from "@/hooks/store/use-workspace";

type Props = {
  entityType: ECustomFieldEntityType;
  /** i18n prefix for this entity, e.g. workspace_settings.settings.custom_fields.projects */
  i18nPrefix: string;
};

export const CustomFieldsManagementRoot = observer(function CustomFieldsManagementRoot(props: Props) {
  const { entityType, i18nPrefix } = props;
  // states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingField, setEditingField] = useState<TCustomField | null>(null);
  const [deletingField, setDeletingField] = useState<TCustomField | null>(null);
  // router
  const { workspaceSlug } = useParams();
  const slug = workspaceSlug?.toString() ?? "";
  // store hooks
  const { t } = useTranslation();
  const { workspaceUserInfo, allowPermissions } = useUserPermissions();
  const { fetchCustomFields, getCustomFieldsByEntity } = useCustomField();
  const { currentWorkspace } = useWorkspace();
  // derived values
  const canManage = allowPermissions([EUserPermissions.ADMIN], EUserPermissionsLevel.WORKSPACE);
  const fields = getCustomFieldsByEntity(entityType);

  const { isLoading } = useSWR(
    canManage && slug ? `CUSTOM_FIELDS_${entityType}_${slug}` : null,
    canManage && slug ? () => fetchCustomFields(slug, entityType) : null
  );

  const pageTitle = currentWorkspace?.name ? `${currentWorkspace.name} - ${t(`${i18nPrefix}.title`)}` : undefined;

  if (workspaceUserInfo && !canManage) {
    return <NotAuthorizedView section="settings" className="h-auto" />;
  }

  const openCreate = () => {
    setEditingField(null);
    setIsCreateOpen(true);
  };

  const openEdit = (field: TCustomField) => {
    setEditingField(field);
    setIsCreateOpen(true);
  };

  return (
    <>
      <PageHead title={pageTitle} />
      <div className="w-full">
        <CreateUpdateFieldModal
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          workspaceSlug={slug}
          entityType={entityType}
          data={editingField}
        />
        <DeleteFieldModal
          isOpen={Boolean(deletingField)}
          onClose={() => setDeletingField(null)}
          workspaceSlug={slug}
          entityType={entityType}
          field={deletingField}
        />

        <SettingsHeading
          title={t(`${i18nPrefix}.title`)}
          description={t(`${i18nPrefix}.description`)}
          control={
            <Button variant="primary" size="lg" onClick={openCreate}>
              {t("workspace_settings.settings.custom_fields.add_field")}
            </Button>
          }
        />

        {isLoading && !fields ? (
          <Loader className="mt-4 space-y-3">
            <Loader.Item height="56px" />
            <Loader.Item height="56px" />
            <Loader.Item height="56px" />
          </Loader>
        ) : fields && fields.length > 0 ? (
          <div className="mt-4">
            <CustomFieldsList
              workspaceSlug={slug}
              entityType={entityType}
              fields={fields}
              onEdit={openEdit}
              onDelete={setDeletingField}
            />
          </div>
        ) : (
          <div className="mt-6">
            <CustomFieldsEmptyState onCreate={openCreate} />
          </div>
        )}
      </div>
    </>
  );
});
