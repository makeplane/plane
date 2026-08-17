/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { useOutletContext, useParams } from "react-router";
import { useTranslation } from "@plane/i18n";
import { FilePreviewButton } from "../components/file-preview";
import { TesthubListRow } from "../components/list-row";
import { TesthubPageBody, TesthubPageLoader, TesthubSectionTitle } from "../components/page-shell";
import { TesthubUnbound } from "../components/unbound";
import type { TTesthubOutletContext } from "../layout";

function TestsPage() {
  const { t } = useTranslation();
  const { workspaceSlug, projectId } = useParams();
  const { catalog, loading } = useOutletContext<TTesthubOutletContext>();
  const base = `/${workspaceSlug}/projects/${projectId}/testhub`;

  if (loading) return <TesthubPageLoader />;
  if (!catalog?.repo) return <TesthubUnbound href={`${base}/bind`} />;

  const features = catalog.snapshot?.payload?.tests?.features ?? [];
  const pytestNodes = catalog.snapshot?.payload?.tests?.pytest_nodes ?? [];

  return (
    <TesthubPageBody>
      <div className="space-y-6">
        <section>
          <TesthubSectionTitle>{t("testhub.nav.tests")}</TesthubSectionTitle>
          <div className="space-y-2">
            {features.map((feature) => (
              <details key={feature.path} className="rounded-md border border-subtle bg-layer-1 p-3" open>
                <summary className="cursor-pointer text-13 text-primary">
                  {feature.name || feature.path}
                  {feature.tags.length ? ` · ${feature.tags.map((tag) => `@${tag}`).join(" ")}` : ""}
                </summary>
                <div className="mt-2">
                  <FilePreviewButton path={feature.path} />
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
          </div>
        </section>
        <section>
          <TesthubSectionTitle>pytest</TesthubSectionTitle>
          <div className="overflow-hidden rounded-md border border-subtle">
            {pytestNodes.map((node) => (
              <TesthubListRow key={node.nodeid}>
                <span className="truncate text-primary">{node.nodeid}</span>
                <FilePreviewButton path={node.file} />
              </TesthubListRow>
            ))}
          </div>
        </section>
      </div>
    </TesthubPageBody>
  );
}

export default observer(TestsPage);
