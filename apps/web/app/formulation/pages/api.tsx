/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useCallback, useMemo } from "react";
import { observer } from "mobx-react";
import { useOutletContext, useParams, useSearchParams } from "react-router";
import { useTranslation } from "@plane/i18n";
import { gitsyncService } from "@plane/services";
import { ApiExplorer } from "@/app/testhub/components/api-docs/api-explorer";
import { TesthubPageLoader, TesthubSplitBody } from "@/app/testhub/components/page-shell";
import { TesthubUnbound } from "@/app/testhub/components/unbound";
import type { TFormulationOutletContext } from "../layout";

function ApiPage() {
  const { t } = useTranslation();
  const { workspaceSlug, projectId } = useParams();
  const { catalog, loading } = useOutletContext<TFormulationOutletContext>();
  const [searchParams, setSearchParams] = useSearchParams();
  const configHref = `/${workspaceSlug}/projects/${projectId}/gitsync`;
  const selectedFile = searchParams.get("api") ?? "";

  const apiObjects = catalog?.payload?.components?.api_objects ?? [];

  const setApi = useCallback(
    (file: string) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.set("api", file);
          return next;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  const loadFile = useCallback(
    async (path: string) => {
      if (!workspaceSlug || !projectId) return { content: "" };
      return gitsyncService.getModuleFile(workspaceSlug, projectId, "features", path);
    },
    [workspaceSlug, projectId]
  );

  const loadFileMemo = useMemo(() => loadFile, [loadFile]);

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
    <TesthubSplitBody>
      <ApiExplorer apis={apiObjects} selectedFile={selectedFile} onSelect={setApi} loadFile={loadFileMemo} />
    </TesthubSplitBody>
  );
}

export default observer(ApiPage);
