/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useState } from "react";
import { observer } from "mobx-react";
import { Link, useOutletContext, useParams } from "react-router";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { EmptyStateCompact } from "@plane/propel/empty-state";
import { testhubService } from "@plane/services";
import type { TTesthubSession } from "@plane/types";
import { TesthubListRow } from "../components/list-row";
import { TesthubPageBody, TesthubPageLoader } from "../components/page-shell";
import { TesthubUnbound } from "../components/unbound";
import type { TTesthubOutletContext } from "../layout";

function SessionsPage() {
  const { t } = useTranslation();
  const { workspaceSlug, projectId } = useParams();
  const { catalog, loading } = useOutletContext<TTesthubOutletContext>();
  const [sessions, setSessions] = useState<TTesthubSession[]>([]);
  const [busy, setBusy] = useState(false);
  const base = `/${workspaceSlug}/projects/${projectId}/testhub`;
  const configHref = `/${workspaceSlug}/projects/${projectId}/gitsync`;

  useEffect(() => {
    if (!workspaceSlug || !projectId || !catalog?.repo) return;
    setBusy(true);
    testhubService
      .listSessions(workspaceSlug, projectId)
      .then(setSessions)
      .catch(() => setSessions([]))
      .finally(() => setBusy(false));
  }, [workspaceSlug, projectId, catalog?.repo]);

  if (loading || busy) return <TesthubPageLoader />;
  if (!catalog?.repo) return <TesthubUnbound href={configHref} />;

  return (
    <TesthubPageBody>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-16 font-medium text-primary">{t("testhub.sessions.title")}</h2>
        <Link to={`${base}/sessions/new`}>
          <Button variant="primary" size="sm">
            {t("testhub.sessions.new")}
          </Button>
        </Link>
      </div>
      {sessions.length ? (
        <div className="overflow-hidden rounded-md border border-subtle">
          {sessions.map((session) => (
            <TesthubListRow key={session.id} to={`${base}/sessions/${session.id}`}>
              <span className="truncate text-primary">{session.name}</span>
              <span className="text-tertiary">
                {session.status} · {session.selection.length}
              </span>
            </TesthubListRow>
          ))}
        </div>
      ) : (
        <EmptyStateCompact
          assetKey="worklog"
          title={t("testhub.sessions.empty")}
          description={t("testhub.sessions.empty_description")}
        />
      )}
    </TesthubPageBody>
  );
}

export default observer(SessionsPage);
