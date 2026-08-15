/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useCallback, useEffect, useState } from "react";
import { observer } from "mobx-react";
import { Link, Outlet, useLocation, useParams } from "react-router";
import { useTranslation } from "@plane/i18n";
import { testhubService } from "@plane/services";
import type { TTesthubCatalogResponse } from "@plane/types";
import { cn } from "@plane/utils";

const NAV = [
  { key: "overview", path: "", i18n: "testhub.nav.overview" },
  { key: "knowledge", path: "/knowledge", i18n: "testhub.nav.knowledge" },
  { key: "components", path: "/components", i18n: "testhub.nav.components" },
  { key: "tools", path: "/tools", i18n: "testhub.nav.tools" },
  { key: "actions", path: "/actions", i18n: "testhub.nav.actions" },
  { key: "tests", path: "/tests", i18n: "testhub.nav.tests" },
  { key: "jobs", path: "/jobs", i18n: "testhub.nav.jobs" },
  { key: "bind", path: "/bind", i18n: "testhub.nav.bind" },
] as const;

export type TTesthubOutletContext = {
  catalog: TTesthubCatalogResponse | null;
  loading: boolean;
  reload: () => Promise<void>;
};

function TesthubLayout() {
  const { t } = useTranslation();
  const location = useLocation();
  const { workspaceSlug, projectId } = useParams();
  const [catalog, setCatalog] = useState<TTesthubCatalogResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    if (!workspaceSlug || !projectId) return;
    const data = await testhubService.getCatalog(workspaceSlug, projectId);
    setCatalog(data);
  }, [workspaceSlug, projectId]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    reload()
      .catch(() => {
        if (!cancelled) setCatalog({ repo: null, snapshot: null });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [reload]);

  const base = `/${workspaceSlug}/projects/${projectId}/testhub`;

  return (
    <div className="flex h-full w-full flex-col bg-surface-1">
      <div className="flex flex-wrap items-center gap-1 border-b border-subtle px-4 py-2">
        <span className="mr-2 text-14 font-medium text-primary">{t("testhub.title")}</span>
        {NAV.map((item) => {
          const href = `${base}${item.path}`;
          const active =
            item.path === ""
              ? location.pathname === href || location.pathname === `${href}/`
              : location.pathname.startsWith(href);
          return (
            <Link
              key={item.key}
              to={href}
              className={cn(
                "rounded-md px-2.5 py-1 text-13 text-secondary hover:bg-layer-1-hover",
                active && "bg-layer-1 text-primary"
              )}
            >
              {t(item.i18n)}
            </Link>
          );
        })}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        <Outlet context={{ catalog, loading, reload } satisfies TTesthubOutletContext} />
      </div>
    </div>
  );
}

export default observer(TesthubLayout);
