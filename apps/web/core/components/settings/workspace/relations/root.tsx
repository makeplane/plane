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

import { useEffect, useState } from "react";
import { observer } from "mobx-react";
// plane imports
import { EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import type { IWorkItemRelationDefinition } from "@plane/types";
import { Loader } from "@plane/ui";
// components
import { SettingsHeading } from "@/components/settings/heading";
// hooks
import { useRelationDefinition } from "@/hooks/store/use-relation-definition";
import { useUserPermissions } from "@/hooks/store/user";
// local imports
import { CreateUpdateRelationInline } from "./create-update-relation-inline";
import { DeleteRelationDefinitionModal } from "./delete-relation-modal";
import { RelationDefinitionItem } from "./relation-definition-item";

type Props = {
  workspaceSlug: string;
};

export const RelationDefinitionRoot = observer(function RelationDefinitionRoot(props: Props) {
  const { workspaceSlug } = props;
  // states
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingDefinition, setDeletingDefinition] = useState<IWorkItemRelationDefinition | null>(null);
  // store hooks
  const { loader, sortedRelationDefinitions, fetchRelationDefinitions } = useRelationDefinition();
  const { allowPermissions } = useUserPermissions();
  const { t } = useTranslation();

  // derived values
  const isEditable = allowPermissions(
    [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
    EUserPermissionsLevel.WORKSPACE
  );
  const isLoading = loader === "init-loader" || loader === undefined;

  // fetch on mount
  useEffect(() => {
    if (workspaceSlug) {
      fetchRelationDefinitions(workspaceSlug, { is_default: "false" });
    }
  }, [workspaceSlug, fetchRelationDefinitions]);

  const handleNewRelation = () => {
    setEditingId(null);
    setShowCreateForm(true);
  };

  return (
    <>
      <DeleteRelationDefinitionModal
        workspaceSlug={workspaceSlug}
        isOpen={!!deletingDefinition}
        data={deletingDefinition}
        onClose={() => setDeletingDefinition(null)}
      />
      <SettingsHeading
        title={t("workspace_settings.settings.relations.heading")}
        description={t("workspace_settings.settings.relations.description")}
        control={
          isEditable ? (
            <Button variant="secondary" size="lg" onClick={handleNewRelation}>
              Add relation
            </Button>
          ) : undefined
        }
      />
      <div className="mt-6 w-full">
        {isLoading ? (
          <Loader className="space-y-5">
            <Loader.Item height="42px" />
            <Loader.Item height="42px" />
            <Loader.Item height="42px" />
          </Loader>
        ) : (
          <>
            {sortedRelationDefinitions.length > 0 || showCreateForm ? (
              <div className="flex flex-col gap-2 rounded-lg border border-subtle bg-layer-1 p-3">
                {sortedRelationDefinitions.map((definition) => (
                  <RelationDefinitionItem
                    key={definition.id}
                    workspaceSlug={workspaceSlug}
                    definition={definition}
                    isEditable={isEditable}
                    isEditing={editingId === definition.id}
                    onEdit={() => {
                      setShowCreateForm(false);
                      setEditingId(definition.id);
                    }}
                    onDelete={() => setDeletingDefinition(definition)}
                    onCancelEdit={() => setEditingId(null)}
                  />
                ))}
                {showCreateForm && (
                  <CreateUpdateRelationInline
                    workspaceSlug={workspaceSlug}
                    isUpdating={false}
                    onClose={() => setShowCreateForm(false)}
                  />
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-lg border border-subtle py-20">
                <p className="text-body-sm-medium text-primary">No relations yet</p>
                <p className="mt-1 text-body-xs-regular text-tertiary">
                  Create custom relation types to link work items.
                </p>
                {isEditable && (
                  <Button variant="secondary" size="sm" className="mt-4" onClick={handleNewRelation}>
                    Add relation
                  </Button>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
});
