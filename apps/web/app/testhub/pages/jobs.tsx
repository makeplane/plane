/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useState } from "react";
import { observer } from "mobx-react";
import { useOutletContext, useParams } from "react-router";
import { useTranslation } from "@plane/i18n";
import { EmptyStateCompact } from "@plane/propel/empty-state";
import { testhubService } from "@plane/services";
import type { TTesthubJob } from "@plane/types";
import { TesthubListRow } from "../components/list-row";
import { TesthubPageBody, TesthubPageLoader } from "../components/page-shell";
import { TesthubUnbound } from "../components/unbound";
import type { TTesthubOutletContext } from "../layout";

function JobsPage() {
  const { t } = useTranslation();
  const { workspaceSlug, projectId } = useParams();
  const { catalog, loading } = useOutletContext<TTesthubOutletContext>();
  const [jobs, setJobs] = useState<TTesthubJob[]>([]);
  const [jobsLoading, setJobsLoading] = useState(false);
  const base = `/${workspaceSlug}/projects/${projectId}/testhub`;

  useEffect(() => {
    if (!workspaceSlug || !projectId || !catalog?.repo) return;
    setJobsLoading(true);
    testhubService
      .listJobs(workspaceSlug, projectId)
      .then(setJobs)
      .catch(() => setJobs([]))
      .finally(() => setJobsLoading(false));
  }, [workspaceSlug, projectId, catalog?.repo]);

  if (loading || jobsLoading) return <TesthubPageLoader />;
  if (!catalog?.repo) return <TesthubUnbound href={`${base}/bind`} />;

  if (!jobs.length) {
    return (
      <TesthubPageBody>
        <EmptyStateCompact
          assetKey="worklog"
          title={t("testhub.jobs.empty")}
          description={t("testhub.empty.no_jobs")}
        />
      </TesthubPageBody>
    );
  }

  return (
    <TesthubPageBody className="px-0 py-0">
      {jobs.map((job) => (
        <TesthubListRow key={job.id} to={`${base}/jobs/${job.id}`}>
          <span>
            <span className="text-primary">
              {job.kind} · {job.status}
            </span>
            <span className="ml-2 text-12 text-tertiary">{job.created_at}</span>
          </span>
        </TesthubListRow>
      ))}
    </TesthubPageBody>
  );
}

export default observer(JobsPage);
