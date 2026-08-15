/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useState } from "react";
import { observer } from "mobx-react";
import { Link, useOutletContext, useParams } from "react-router";
import { useTranslation } from "@plane/i18n";
import { testhubService } from "@plane/services";
import type { TTesthubJob } from "@plane/types";
import { TesthubUnbound } from "../components/unbound";
import type { TTesthubOutletContext } from "../layout";

function JobsPage() {
  const { t } = useTranslation();
  const { workspaceSlug, projectId } = useParams();
  const { catalog, loading } = useOutletContext<TTesthubOutletContext>();
  const [jobs, setJobs] = useState<TTesthubJob[]>([]);
  const base = `/${workspaceSlug}/projects/${projectId}/testhub`;

  useEffect(() => {
    if (!workspaceSlug || !projectId || !catalog?.repo) return;
    testhubService
      .listJobs(workspaceSlug, projectId)
      .then(setJobs)
      .catch(() => setJobs([]));
  }, [workspaceSlug, projectId, catalog?.repo]);

  if (loading) return <p className="text-13 text-secondary">…</p>;
  if (!catalog?.repo) return <TesthubUnbound href={`${base}/bind`} />;

  if (!jobs.length) return <p className="text-13 text-secondary">{t("testhub.jobs.empty")}</p>;

  return (
    <ul className="space-y-2">
      {jobs.map((job) => (
        <li key={job.id}>
          <Link to={`${base}/jobs/${job.id}`} className="block rounded-md bg-layer-1 px-3 py-2 hover:bg-layer-1-hover">
            <p className="text-13 text-primary">
              {job.kind} · {job.status}
            </p>
            <p className="text-12 text-tertiary">{job.created_at}</p>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export default observer(JobsPage);
