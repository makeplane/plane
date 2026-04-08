/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect } from "react";
import { observer } from "mobx-react";
// hooks
import { useMonitoring } from "@/hooks/store";

export const ScheduledJobsTab = observer(() => {
  const { scheduledJobs, isLoading, error, fetchScheduledJobs } = useMonitoring();

  useEffect(() => {
    void fetchScheduledJobs();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (error.scheduledJobs) {
    return <div className="text-danger-primary text-body-sm-regular py-8 text-center">{error.scheduledJobs}</div>;
  }

  if (isLoading.scheduledJobs) {
    return <div className="text-secondary text-body-sm-regular py-8 text-center">Loading scheduled jobs...</div>;
  }

  return (
    <div className="overflow-x-auto rounded-md border border-subtle">
      <table className="w-full text-body-sm-regular">
        <thead>
          <tr className="border-b border-subtle bg-surface-2">
            <th className="px-3 py-2 text-left text-body-xs-medium text-secondary">Name</th>
            <th className="px-3 py-2 text-left text-body-xs-medium text-secondary">Task</th>
            <th className="px-3 py-2 text-left text-body-xs-medium text-secondary">Schedule</th>
            <th className="px-3 py-2 text-left text-body-xs-medium text-secondary">Enabled</th>
            <th className="px-3 py-2 text-left text-body-xs-medium text-secondary">Last Run</th>
            <th className="px-3 py-2 text-right text-body-xs-medium text-secondary">Run Count</th>
          </tr>
        </thead>
        <tbody>
          {scheduledJobs.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-3 py-8 text-center text-secondary">
                No scheduled jobs found.
              </td>
            </tr>
          ) : (
            scheduledJobs.map((job) => (
              <tr key={job.id} className="border-b border-subtle last:border-b-0 hover:bg-surface-2/50">
                <td className="px-3 py-2 text-primary font-medium">{job.name}</td>
                <td className="px-3 py-2 text-secondary font-mono text-body-xs-regular truncate max-w-[200px]">
                  {job.task}
                </td>
                <td className="px-3 py-2 text-secondary font-mono text-body-xs-regular">{job.schedule_display}</td>
                <td className="px-3 py-2">
                  <span
                    className={`inline-block h-2 w-2 rounded-full ${job.enabled ? "bg-success-primary" : "bg-danger-primary"}`}
                  />
                </td>
                <td className="px-3 py-2 text-secondary">
                  {job.last_run_at ? new Date(job.last_run_at).toLocaleString() : "Never"}
                </td>
                <td className="px-3 py-2 text-right text-secondary">{job.total_run_count.toLocaleString()}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
});

(ScheduledJobsTab as any).displayName = "ScheduledJobsTab";
