/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { ReactNode } from "react";
import { useParams } from "react-router";
import { useTranslation } from "@plane/i18n";
import type { TTesthubCatalogResponse } from "@plane/types";
import { TesthubPageLoader } from "@/app/testhub/components/page-shell";
import { TesthubUnbound } from "@/app/testhub/components/unbound";
import type { TFormulationOutletContext } from "../layout";

type Props = TFormulationOutletContext & {
  children: ReactNode;
};

function hasPlatformCatalog(testhub: TTesthubCatalogResponse | null): boolean {
  const payload = testhub?.snapshot?.payload;
  if (!testhub?.repo || !payload) return false;
  if (testhub.snapshot?.sha) return true;
  if ((payload.catalog_version ?? 0) >= 2) return true;
  return Boolean(payload.tools || payload.components);
}

export function FormulationRegisteredAssets({ catalog, testhub, loading, testhubLoading, children }: Props) {
  const { t } = useTranslation();
  const { workspaceSlug, projectId } = useParams();
  const configHref = `/${workspaceSlug}/projects/${projectId}/gitsync`;
  const testhubHref = `/${workspaceSlug}/projects/${projectId}/testhub`;

  if (loading || testhubLoading) return <TesthubPageLoader />;
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
  if (!hasPlatformCatalog(testhub)) {
    return (
      <TesthubUnbound
        href={testhubHref}
        title={t("formulation.sync_assets")}
        description={t("formulation.sync_assets_description")}
        cta={t("formulation.sync_assets_cta")}
      />
    );
  }
  return <>{children}</>;
}
