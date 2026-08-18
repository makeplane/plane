/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "react-router";
import { useTranslation } from "@plane/i18n";
import { EmptyStateCompact } from "@plane/propel/empty-state";
import { testhubService } from "@plane/services";
import type { TTesthubJob, TTesthubRepo } from "@plane/types";
import { TesthubListRow } from "@/app/testhub/components/list-row";
import { TesthubPageBody, TesthubPageLoader } from "@/app/testhub/components/page-shell";
import { TesthubUnbound } from "@/app/testhub/components/unbound";

function JobsListPage() {
  const { t } = useTranslation();
  const { workspaceSlug, projectId } = useParams();
  const [jobs, setJobs] = useState<TTesthubJob[]>([]);
  const [repo, setRepo] = useState<TTesthubRepo | null>(null);
  const [loading, setLoading] = useState(true);
  const base = `/${workspaceSlug}/projects/${projectId}/jobs`;
  const configHref = `/${workspaceSlug}/projects/${projectId}/gitsync`;

  useEffect(() => {
    if (!workspaceSlug || !projectId) return;
    let cancelled = false;
    setLoading(true);
    Promise.all([
      testhubService.getRepo(workspaceSlug, projectId).catch(() => ({ repo: null })),
      testhubService.listJobs(workspaceSlug, projectId).catch(() => [] as TTesthubJob[]),
    ])
      .then(([repoResponse, jobList]) => {
        if (cancelled) return jobList;
        setRepo(repoResponse.repo);
        setJobs(jobList);
        return jobList;
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [workspaceSlug, projectId]);

  if (loading) return <TesthubPageLoader />;
  if (!repo) {
    return (
      <TesthubUnbound
        href={configHref}
        title={t("jobs.unbound")}
        description={t("jobs.unbound_description")}
        cta={t("jobs.cta")}
      />
    );
  }

  if (!jobs.length) {
    return (
      <TesthubPageBody>
        <EmptyStateCompact assetKey="worklog" title={t("jobs.empty")} description={t("jobs.empty_description")} />
      </TesthubPageBody>
    );
  }

  return (
    <TesthubPageBody className="px-0 py-0">
      {jobs.map((job) => (
        <TesthubListRow key={job.id} to={`${base}/${job.id}`}>
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

export default observer(JobsListPage);
