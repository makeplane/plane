/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useState } from "react";
import { observer } from "mobx-react";
import { Link, useParams } from "react-router";
import { useTranslation } from "@plane/i18n";
import { testhubService } from "@plane/services";
import type { TTesthubSession } from "@plane/types";
import { TesthubListRow } from "../components/list-row";
import { TesthubPageBody, TesthubPageLoader, TesthubSectionTitle } from "../components/page-shell";

function SessionDetailPage() {
  const { t } = useTranslation();
  const { workspaceSlug, projectId, sessionId } = useParams();
  const [session, setSession] = useState<TTesthubSession | null>(null);

  useEffect(() => {
    if (!workspaceSlug || !projectId || !sessionId) return;
    testhubService
      .getSession(workspaceSlug, projectId, sessionId)
      .then(setSession)
      .catch(() => setSession(null));
  }, [workspaceSlug, projectId, sessionId]);

  if (!session) return <TesthubPageLoader />;

  const formulationBase = `/${workspaceSlug}/projects/${projectId}/formulation`;

  return (
    <TesthubPageBody>
      <div className="space-y-4">
        <div>
          <h2 className="text-16 font-medium text-primary">{session.name}</h2>
          <p className="text-13 text-secondary">
            {t("testhub.sessions.status")}: {session.status} · {t("testhub.sessions.sha")}: {session.feature_sha || "—"}
          </p>
          <p className="text-13 text-tertiary">
            {t("testhub.sessions.environment")}: {session.environment_id || "—"}
          </p>
        </div>
        <TesthubSectionTitle>{t("testhub.sessions.report")}</TesthubSectionTitle>
        <div className="overflow-hidden rounded-md border border-subtle">
          {session.selection.map((item) => (
            <TesthubListRow key={`${item.feature_path}:${item.scenario_name}`}>
              <span className="truncate text-primary">
                {item.feature_path}
                {item.scenario_name ? ` · ${item.scenario_name}` : ""}
              </span>
              <span className="flex items-center gap-3">
                <span className="text-tertiary">{t("testhub.sessions.pending")}</span>
                <Link to={formulationBase} className="text-13 text-accent-primary">
                  {t("testhub.sessions.open_scene")}
                </Link>
              </span>
            </TesthubListRow>
          ))}
        </div>
      </div>
    </TesthubPageBody>
  );
}

export default observer(SessionDetailPage);
