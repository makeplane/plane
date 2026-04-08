/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useCallback, useEffect, useRef } from "react";
import { observer } from "mobx-react";
import { AlertTriangle, RefreshCw } from "lucide-react";
// hooks
import { useMonitoring } from "@/hooks/store";

const REFRESH_INTERVAL = 30_000;

export const WorkerHealthTab = observer(() => {
  const { workerHealth, isLoading, fetchWorkerHealth } = useMonitoring();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refresh = useCallback(() => {
    void fetchWorkerHealth();
  }, [fetchWorkerHealth]);

  useEffect(() => {
    void refresh();
    intervalRef.current = setInterval(refresh, REFRESH_INTERVAL);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [refresh]);

  if (isLoading.workerHealth && !workerHealth) {
    return <div className="text-secondary text-body-sm-regular py-8 text-center">Loading worker health...</div>;
  }

  // Error state — no workers reachable
  if (workerHealth?.error) {
    return (
      <div className="rounded-md border border-subtle p-6 text-center space-y-3">
        <AlertTriangle className="mx-auto h-8 w-8 text-warning-primary" />
        <p className="text-primary text-body-sm-medium">Could not reach Celery workers</p>
        <p className="text-secondary text-body-xs-regular">Workers may be offline or not responding.</p>
        <button
          type="button"
          onClick={refresh}
          className="rounded-md bg-primary/10 px-3 py-1.5 text-body-sm-medium text-primary hover:bg-primary/20 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  const summary = workerHealth?.summary;
  const workers = workerHealth?.workers ?? [];

  return (
    <div className="space-y-4">
      {/* Summary bar */}
      <div className="flex items-center gap-6 rounded-md border border-subtle bg-surface-2/50 px-4 py-3">
        <div className="text-body-sm-regular text-secondary">
          Workers: <span className="text-primary font-medium">{summary?.total_workers ?? 0}</span>
        </div>
        <div className="text-body-sm-regular text-secondary">
          Active Tasks: <span className="text-primary font-medium">{summary?.total_active_tasks ?? 0}</span>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-body-xs-regular text-secondary">Auto-refresh: 30s</span>
          <button
            type="button"
            onClick={refresh}
            disabled={isLoading.workerHealth}
            className="rounded-md p-1.5 text-secondary hover:bg-surface-2 hover:text-primary transition-colors disabled:opacity-50"
            title="Refresh now"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading.workerHealth ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Worker cards */}
      {workers.length === 0 ? (
        <div className="text-secondary text-body-sm-regular py-8 text-center">No workers detected.</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {workers.map((worker) => (
            <div key={worker.name} className="rounded-md border border-subtle p-4 space-y-2">
              <div className="text-primary text-body-sm-medium truncate" title={worker.name}>
                {worker.name}
              </div>
              <div className="space-y-1 text-body-xs-regular text-secondary">
                <div>
                  Active Tasks: <span className="text-primary">{worker.active_tasks}</span>
                </div>
                {worker.pool_info && (
                  <div>
                    Pool: <span className="text-primary">{worker.pool_info}</span>
                  </div>
                )}
                {worker.uptime && (
                  <div>
                    Uptime: <span className="text-primary">{worker.uptime}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

(WorkerHealthTab as any).displayName = "WorkerHealthTab";
