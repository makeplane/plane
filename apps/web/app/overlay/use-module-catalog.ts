/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router";
import { gitsyncService } from "@plane/services";
import type { TGitSyncModuleKey, TModuleCatalogResponse } from "@plane/types";

export function useModuleCatalog(moduleKey: TGitSyncModuleKey) {
  const { workspaceSlug, projectId } = useParams();
  const [catalog, setCatalog] = useState<TModuleCatalogResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    if (!workspaceSlug || !projectId) return;
    const data = await gitsyncService.getModuleCatalog(workspaceSlug, projectId, moduleKey);
    setCatalog(data);
  }, [workspaceSlug, projectId, moduleKey]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    reload()
      .catch(() => {
        if (!cancelled) setCatalog({ module_key: moduleKey, remote: null, payload: null });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [reload, moduleKey]);

  return { catalog, loading, reload };
}
