/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useCallback, useEffect, useState } from "react";
import { observer } from "mobx-react";
import { cn } from "@plane/utils";
// hooks
import { useMonitoring } from "@/hooks/store";
// types
import type { TEmailLogFilters } from "@/store/monitoring.types";
// local
import { EmailLogStatusBadge } from "./email-log-status-badge";

export const EmailLogsTab = observer(() => {
  const { emailLogs, emailLogsPagination, emailLogsFilters, isLoading, error, fetchEmailLogs, setEmailLogsFilters } =
    useMonitoring();
  const [localFilters, setLocalFilters] = useState<TEmailLogFilters>(emailLogsFilters);

  useEffect(() => {
    void fetchEmailLogs();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleApplyFilters = useCallback(() => {
    setEmailLogsFilters(localFilters);
    void fetchEmailLogs();
  }, [localFilters, setEmailLogsFilters, fetchEmailLogs]);

  const handlePageChange = useCallback(
    (cursor: string) => {
      void fetchEmailLogs(cursor);
    },
    [fetchEmailLogs]
  );

  if (error.emailLogs) {
    return <div className="text-danger-primary text-body-sm-regular py-8 text-center">{error.emailLogs}</div>;
  }

  return (
    <div className="space-y-3">
      {/* Filters */}
      <div className="flex items-end gap-3 flex-wrap">
        <label className="space-y-1">
          <span className="text-body-xs-medium text-secondary">Date From</span>
          <input
            type="date"
            value={localFilters.date_from ?? ""}
            onChange={(e) => setLocalFilters((f) => ({ ...f, date_from: e.target.value || undefined }))}
            className="block rounded-md border border-subtle bg-surface-1 px-2 py-1 text-body-sm-regular text-primary"
          />
        </label>
        <label className="space-y-1">
          <span className="text-body-xs-medium text-secondary">Date To</span>
          <input
            type="date"
            value={localFilters.date_to ?? ""}
            onChange={(e) => setLocalFilters((f) => ({ ...f, date_to: e.target.value || undefined }))}
            className="block rounded-md border border-subtle bg-surface-1 px-2 py-1 text-body-sm-regular text-primary"
          />
        </label>
        <label className="space-y-1">
          <span className="text-body-xs-medium text-secondary">Entity</span>
          <input
            type="text"
            placeholder="e.g. issue"
            value={localFilters.entity_name ?? ""}
            onChange={(e) => setLocalFilters((f) => ({ ...f, entity_name: e.target.value || undefined }))}
            className="block rounded-md border border-subtle bg-surface-1 px-2 py-1 text-body-sm-regular text-primary w-32"
          />
        </label>
        <button
          type="button"
          onClick={handleApplyFilters}
          className="rounded-md bg-primary/10 px-3 py-1.5 text-body-sm-medium text-primary hover:bg-primary/20 transition-colors"
        >
          Apply
        </button>
      </div>

      {/* Table */}
      {isLoading.emailLogs ? (
        <div className="text-secondary text-body-sm-regular py-8 text-center">Loading email logs...</div>
      ) : (
        <div className="overflow-x-auto rounded-md border border-subtle">
          <table className="w-full text-body-sm-regular">
            <thead>
              <tr className="border-b border-subtle bg-surface-2">
                <th className="px-3 py-2 text-left text-body-xs-medium text-secondary">Receiver</th>
                <th className="px-3 py-2 text-left text-body-xs-medium text-secondary">Triggered By</th>
                <th className="px-3 py-2 text-left text-body-xs-medium text-secondary">Entity</th>
                <th className="px-3 py-2 text-left text-body-xs-medium text-secondary">Created</th>
                <th className="px-3 py-2 text-left text-body-xs-medium text-secondary">Status</th>
              </tr>
            </thead>
            <tbody>
              {emailLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-3 py-8 text-center text-secondary">
                    No email logs found.
                  </td>
                </tr>
              ) : (
                emailLogs.map((log) => (
                  <tr key={log.id} className="border-b border-subtle last:border-b-0 hover:bg-surface-2/50">
                    <td className="px-3 py-2 text-primary">{log.receiver_email}</td>
                    <td className="px-3 py-2 text-primary">{log.triggered_by_email}</td>
                    <td className="px-3 py-2 text-primary">{log.entity_name}</td>
                    <td className="px-3 py-2 text-secondary">{new Date(log.created_at).toLocaleDateString()}</td>
                    <td className="px-3 py-2">
                      <EmailLogStatusBadge processedAt={log.processed_at} sentAt={log.sent_at} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {emailLogsPagination && (
        <div className="flex items-center justify-between text-body-sm-regular text-secondary">
          <span>Total: {emailLogsPagination.total_results} results</span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={!emailLogsPagination.prev_page_results}
              onClick={() => handlePageChange(emailLogsPagination.prev_cursor)}
              className={cn(
                "px-3 py-1 rounded-md border border-subtle",
                emailLogsPagination.prev_page_results
                  ? "text-primary hover:bg-surface-2 cursor-pointer"
                  : "text-secondary/50 cursor-not-allowed"
              )}
            >
              Prev
            </button>
            <button
              type="button"
              disabled={!emailLogsPagination.next_page_results}
              onClick={() => handlePageChange(emailLogsPagination.next_cursor)}
              className={cn(
                "px-3 py-1 rounded-md border border-subtle",
                emailLogsPagination.next_page_results
                  ? "text-primary hover:bg-surface-2 cursor-pointer"
                  : "text-secondary/50 cursor-not-allowed"
              )}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
});

(EmailLogsTab as any).displayName = "EmailLogsTab";
