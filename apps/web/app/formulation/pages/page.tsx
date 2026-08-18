/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { useOutletContext, useParams } from "react-router";
import { useTranslation } from "@plane/i18n";
import { EmptyStateCompact } from "@plane/propel/empty-state";
import { TesthubListRow } from "@/app/testhub/components/list-row";
import { TesthubPageBody, TesthubPageLoader } from "@/app/testhub/components/page-shell";
import { TesthubUnbound } from "@/app/testhub/components/unbound";
import type { TFormulationOutletContext } from "../layout";

function PageObjectsPage() {
  const { t } = useTranslation();
  const { workspaceSlug, projectId } = useParams();
  const { catalog, loading } = useOutletContext<TFormulationOutletContext>();
  const configHref = `/${workspaceSlug}/projects/${projectId}/gitsync`;
  const pageObjects = catalog?.payload?.components?.page_objects ?? [];

  if (loading) return <TesthubPageLoader />;
  if (!catalog?.remote) {
    return (
      <TesthubUnbound
        href={configHref}
        title={t("formulation.unbound")}
        description={t("formulation.unbound_description")}
        cta={t("formulation.cta")}
      />
    );
  }

  return (
    <TesthubPageBody>
      {pageObjects.length ? (
        <div className="overflow-hidden rounded-md border border-subtle">
          {pageObjects.map((row) => (
            <TesthubListRow key={row.path}>
              <span className="truncate text-primary">
                {row.name}
                <span className="ml-2 text-tertiary">{row.path}</span>
              </span>
            </TesthubListRow>
          ))}
        </div>
      ) : (
        <EmptyStateCompact assetKey="note" title={t("formulation.empty")} />
      )}
    </TesthubPageBody>
  );
}

export default observer(PageObjectsPage);
