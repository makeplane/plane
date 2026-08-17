/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { useOutletContext, useParams } from "react-router";
import { useTranslation } from "@plane/i18n";
import { FilePreviewButton } from "@/app/testhub/components/file-preview";
import { TesthubPageBody, TesthubPageLoader, TesthubSectionTitle } from "@/app/testhub/components/page-shell";
import { TesthubUnbound } from "@/app/testhub/components/unbound";
import type { TEnvironmentsOutletContext } from "../layout";

function ConnectionsPage() {
  const { t } = useTranslation();
  const { workspaceSlug, projectId } = useParams();
  const { catalog, loading } = useOutletContext<TEnvironmentsOutletContext>();
  const configHref = `/${workspaceSlug}/projects/${projectId}/gitsync`;

  if (loading) return <TesthubPageLoader />;
  if (!catalog?.remote) {
    return (
      <TesthubUnbound
        href={configHref}
        title={t("environments.unbound")}
        description={t("environments.unbound_description")}
        cta={t("environments.cta")}
      />
    );
  }

  const environments = catalog.payload?.environments ?? [];

  return (
    <TesthubPageBody>
      <p className="mb-4 text-13 text-secondary">{t("environments.redacted_hint")}</p>
      <div className="space-y-4">
        {environments.map((env) => (
          <section key={env.id} className="space-y-3 rounded-md border border-subtle p-3">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-14 font-medium text-primary">{env.name}</h2>
              {env.source ? <FilePreviewButton path={env.source} moduleKey="environments" /> : null}
            </div>
            <TesthubSectionTitle>{t("environments.targets")}</TesthubSectionTitle>
            <ul className="space-y-1 text-13 text-secondary">
              {env.targets.map((target) => (
                <li key={target.id}>
                  {target.kind} · {target.base_url}
                </li>
              ))}
              {!env.targets.length ? <li className="text-tertiary">{t("environments.empty")}</li> : null}
            </ul>
            <TesthubSectionTitle>{t("environments.datasources")}</TesthubSectionTitle>
            <ul className="space-y-1 text-13 text-secondary">
              {env.datasources.map((ds) => (
                <li key={ds.alias}>
                  {ds.alias} · {ds.engine || "—"} · {ds.host || "—"} · {ds.database || "—"}
                </li>
              ))}
              {!env.datasources.length ? <li className="text-tertiary">{t("environments.empty")}</li> : null}
            </ul>
            <TesthubSectionTitle>{t("environments.secret_keys")}</TesthubSectionTitle>
            <p className="text-13 text-tertiary">{env.secret_keys.join(", ") || "—"}</p>
            <TesthubSectionTitle>{t("environments.variables")}</TesthubSectionTitle>
            <ul className="space-y-1 text-13 text-secondary">
              {env.variables.map((item) => (
                <li key={item.key}>
                  {item.key} = {item.value}
                </li>
              ))}
            </ul>
          </section>
        ))}
        {!environments.length ? <p className="text-13 text-tertiary">{t("environments.empty")}</p> : null}
      </div>
    </TesthubPageBody>
  );
}

export default observer(ConnectionsPage);
