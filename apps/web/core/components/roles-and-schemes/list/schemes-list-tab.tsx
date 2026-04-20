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

import { useMemo, useState } from "react";
import { observer } from "mobx-react";
import { useNavigate } from "react-router";
// plane imports
import { getPermissionGroupsByNamespace } from "@plane/constants";
import type { PermissionNamespace } from "@plane/types";
// components
import { DeleteSchemeModal } from "@/components/roles-and-schemes/schemes/delete-scheme-modal";
import { RolesAndSchemesListLoader } from "./list-loader";
import { SchemeCard } from "./scheme-card";
// hooks
import { usePermissionScheme } from "@/hooks/store/use-permission-scheme";

type Props = {
  workspaceSlug: string;
  namespace: PermissionNamespace;
  schemeIds: string[] | undefined;
  canEdit: (schemeId: string) => boolean;
  canDelete: (schemeId: string) => boolean;
};

export const SchemesListTab = observer(function SchemesListTab(props: Props) {
  const { workspaceSlug, namespace, schemeIds, canEdit, canDelete } = props;
  // state
  const [deleteSchemeId, setDeleteSchemeId] = useState<string | null>(null);
  // router
  const navigate = useNavigate();
  // store hooks
  const { getSchemeDetailsBySchemeId } = usePermissionScheme();
  // derived values
  const groups = useMemo(() => getPermissionGroupsByNamespace(namespace), [namespace]);

  if (!schemeIds) return <RolesAndSchemesListLoader />;

  return (
    <>
      {deleteSchemeId && (
        <DeleteSchemeModal
          isOpen={!!deleteSchemeId}
          onClose={() => setDeleteSchemeId(null)}
          workspaceSlug={workspaceSlug}
          schemeId={deleteSchemeId}
        />
      )}
      <div className="grid grid-cols-1 gap-4">
        {schemeIds.map((schemeId) => {
          const scheme = getSchemeDetailsBySchemeId(schemeId);
          if (!scheme) return null;

          return (
            <SchemeCard
              key={schemeId}
              scheme={scheme}
              groups={groups}
              canEdit={canEdit(scheme.id)}
              canDelete={canDelete(scheme.id)}
              onEdit={() => navigate(`schemes/${scheme.slug}`)}
              onDelete={() => setDeleteSchemeId(scheme.id)}
            />
          );
        })}
      </div>
    </>
  );
});
