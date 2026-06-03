/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect } from "react";
import { observer } from "mobx-react";
import useSWR, { mutate } from "swr";
import { AlertCircle, CheckCircle2, Clock, Loader2, RefreshCw } from "lucide-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { TImportJob, TImportJobStatus } from "@plane/types";
import { Loader } from "@plane/ui";
// constants
import { JIRA_IMPORT_JOBS_LIST } from "@/constants/fetch-keys";
// services
import { JiraImportService } from "@/services/integrations/jira-import.service";

const jiraImportService = new JiraImportService();

const STATUS_ICON: Record<TImportJobStatus, React.ReactNode> = {
  queued: <Clock className="size-4 text-tertiary" />,
  processing: <Loader2 className="size-4 animate-spin text-accent-primary" />,
  completed: <CheckCircle2 className="size-4 text-success-primary" />,
  failed: <AlertCircle className="size-4 text-danger-primary" />,
};

type Props = { workspaceSlug: string };

export const PrevImports = observer(function PrevImports({ workspaceSlug }: Props) {
  const { t } = useTranslation();

  const { data: jobs, isLoading } = useSWR<TImportJob[]>(
    workspaceSlug ? JIRA_IMPORT_JOBS_LIST(workspaceSlug) : null,
    workspaceSlug ? () => jiraImportService.getImportJobs(workspaceSlug) : null
  );

  useEffect(() => {
    const interval = setInterval(() => {
      if (jobs?.some((job) => job.status === "processing" || job.status === "queued")) {
        mutate(JIRA_IMPORT_JOBS_LIST(workspaceSlug));
      } else {
        clearInterval(interval);
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [jobs, workspaceSlug]);

  const handleReRun = async (job: TImportJob) => {
    const token = window.prompt(t("workspace_settings.settings.imports.re_run_token_prompt"));
    if (!token) return;
    try {
      await jiraImportService.reRunImportJob(workspaceSlug, job.id, token);
      mutate(JIRA_IMPORT_JOBS_LIST(workspaceSlug));
    } catch (error) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("workspace_settings.settings.imports.jira.toasts.error.title"),
        message: (error as { error?: string })?.error ?? "",
      });
    }
  };

  if (isLoading) {
    return (
      <Loader className="space-y-3">
        <Loader.Item height="48px" />
        <Loader.Item height="48px" />
      </Loader>
    );
  }

  if (!jobs?.length) {
    return (
      <p className="py-8 text-center text-13 text-tertiary">{t("workspace_settings.settings.imports.no_imports")}</p>
    );
  }

  return (
    <div className="divide-y divide-subtle">
      {jobs.map((job) => {
        const report = job.report ?? {};
        const counts: { label: string; value: number }[] = [
          { label: "projects", value: report.projects ?? 0 },
          { label: "work items", value: report.work_items ?? 0 },
          { label: "cycles", value: report.cycles ?? 0 },
          { label: "members", value: report.members ?? 0 },
          { label: "comments", value: report.comments ?? 0 },
        ].filter((entry) => entry.value > 0);
        return (
          <div key={job.id} className="flex items-start justify-between gap-4 py-3">
            <div className="flex items-start gap-3">
              {STATUS_ICON[job.status]}
              <div>
                <p className="text-13 font-medium text-secondary capitalize">
                  {job.source} · {t(`workspace_settings.settings.imports.status.${job.status}`)}
                  {job.external_id ? ` · ${job.external_id}` : ""}
                </p>
                <p className="mt-0.5 text-11 text-tertiary">
                  {counts.length > 0
                    ? counts.map((entry) => `${entry.value} ${entry.label}`).join(" · ")
                    : new Date(job.created_at).toLocaleString()}
                </p>
                {job.status === "failed" && job.reason && (
                  <p className="mt-1 text-11 text-danger-primary">{job.reason}</p>
                )}
              </div>
            </div>
            {(job.status === "completed" || job.status === "failed") && (
              <Button
                variant="tertiary"
                size="sm"
                onClick={() => handleReRun(job)}
                prependIcon={<RefreshCw className="size-3" />}
              >
                {t("workspace_settings.settings.imports.re_run")}
              </Button>
            )}
          </div>
        );
      })}
    </div>
  );
});
