/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { Link, useOutletContext, useParams } from "react-router";
import { useTranslation } from "@plane/i18n";
import { FilePreviewButton } from "@/app/testhub/components/file-preview";
import { TesthubPageBody, TesthubPageLoader, TesthubSectionTitle } from "@/app/testhub/components/page-shell";
import { TesthubUnbound } from "@/app/testhub/components/unbound";
import type { TFormulationOutletContext } from "../layout";

function ScenesPage() {
  const { t } = useTranslation();
  const { workspaceSlug, projectId } = useParams();
  const { catalog, loading } = useOutletContext<TFormulationOutletContext>();
  const configHref = `/${workspaceSlug}/projects/${projectId}/gitsync`;
  const sessionHref = `/${workspaceSlug}/projects/${projectId}/testhub/sessions/new`;

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

  const features = catalog.payload?.features ?? [];

  return (
    <TesthubPageBody>
      <div className="space-y-6">
        <section>
          <TesthubSectionTitle>{t("formulation.nav.scenes")}</TesthubSectionTitle>
          <div className="space-y-2">
            {features.map((feature) => (
              <details key={feature.path} className="rounded-md border border-subtle bg-layer-1 p-3" open>
                <summary className="cursor-pointer text-13 text-primary">
                  {feature.name || feature.path}
                  {feature.tags.length ? ` · ${feature.tags.map((tag) => `@${tag}`).join(" ")}` : ""}
                </summary>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <FilePreviewButton path={feature.path} moduleKey="features" />
                  <Link
                    to={`${sessionHref}?feature=${encodeURIComponent(feature.path)}`}
                    className="text-13 text-accent-primary"
                  >
                    {t("formulation.cite")}
                  </Link>
                </div>
                <ul className="mt-2 space-y-1 pl-3">
                  {feature.scenarios.map((scenario) => (
                    <li key={scenario.name} className="text-13 text-secondary">
                      {scenario.name}
                      {scenario.tags.length ? ` · ${scenario.tags.map((tag) => `@${tag}`).join(" ")}` : ""}
                    </li>
                  ))}
                </ul>
              </details>
            ))}
            {!features.length ? <p className="text-13 text-tertiary">{t("formulation.empty")}</p> : null}
          </div>
        </section>
      </div>
    </TesthubPageBody>
  );
}

export default observer(ScenesPage);
