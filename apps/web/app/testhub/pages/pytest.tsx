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

function PytestPage() {
  const { t } = useTranslation();
  const { workspaceSlug, projectId } = useParams();
  const { catalog, loading } = useOutletContext<TTesthubOutletContext>();
  const configHref = `/${workspaceSlug}/projects/${projectId}/gitsync`;
  const pytestNodes = catalog?.snapshot?.payload?.tests?.pytest_nodes ?? [];

  if (loading) return <TesthubPageLoader />;
  if (!catalog?.repo) return <TesthubUnbound href={configHref} />;

  return (
    <TesthubPageBody>
      <TesthubSectionTitle>{t("testhub.nav.pytest")}</TesthubSectionTitle>
      <div className="overflow-hidden rounded-md border border-subtle">
        {pytestNodes.map((node) => (
          <TesthubListRow key={node.nodeid}>
            <span className="truncate text-primary">{node.nodeid}</span>
            <FilePreviewButton path={node.file} />
          </TesthubListRow>
        ))}
      </div>
    </TesthubPageBody>
  );
}

export default observer(PytestPage);
