/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "react-router";
import { testhubService } from "@plane/services";
import type { TTesthubJob } from "@plane/types";

function JobDetailPage() {
  const { workspaceSlug, projectId, jobId } = useParams();
  const [job, setJob] = useState<TTesthubJob | null>(null);

  useEffect(() => {
    if (!workspaceSlug || !projectId || !jobId) return;
    let cancelled = false;
    const load = async () => {
      try {
        const data = await testhubService.getJob(workspaceSlug, projectId, jobId);
        if (!cancelled) setJob(data);
        return data;
      } catch {
        if (!cancelled) setJob(null);
        return null;
      }
    };
    void load();
    const timer = window.setInterval(async () => {
      const data = await load();
      if (data && (data.status === "succeeded" || data.status === "failed")) {
        window.clearInterval(timer);
      }
    }, 2000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [workspaceSlug, projectId, jobId]);

  if (!job) return <p className="text-13 text-secondary">…</p>;

  return (
    <div className="space-y-3">
      <p className="text-14 font-medium text-primary">
        {job.kind} · {job.status} · exit {job.exit_code ?? "—"}
      </p>
      <pre className="overflow-auto rounded-md bg-layer-1 p-3 text-12 text-secondary">{job.argv.join(" ")}</pre>
      <pre className="max-h-80 overflow-auto rounded-md bg-layer-1 p-3 text-12 whitespace-pre-wrap text-secondary">
        {job.stdout || "(no stdout)"}
      </pre>
      {job.stderr ? (
        <pre className="max-h-64 overflow-auto rounded-md bg-layer-1 p-3 text-12 whitespace-pre-wrap text-danger-primary">
          {job.stderr}
        </pre>
      ) : null}
    </div>
  );
}

export default observer(JobDetailPage);
