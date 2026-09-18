/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { observer } from "mobx-react";
// plane imports
import { USER_IMPORT_ROW_STATUS_LABELS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { TUserImportBatch, TUserImportBatchSummary } from "@plane/types";
import { Spinner } from "@plane/ui";
// services
import { ResearchAccountService } from "@/services/research/account.service";

const accountService = new ResearchAccountService();

type Props = {
  workspaceSlug: string;
};

/**
 * Two-channel import (page + command): upload the roster, review the dry run,
 * then commit. Rows whose advisor has no mailbox mapping stay in the pending
 * list instead of failing the batch (SYS-IMP-01 ~ SYS-IMP-09).
 */
export const ResearchUserImportPanel = observer(function ResearchUserImportPanel({ workspaceSlug }: Props) {
  const { t } = useTranslation();
  const studentInput = useRef<HTMLInputElement>(null);
  const advisorInput = useRef<HTMLInputElement>(null);
  const submitting = useRef(false);
  const [batches, setBatches] = useState<TUserImportBatchSummary[]>([]);
  const [activeBatch, setActiveBatch] = useState<TUserImportBatch | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [resetPasswords, setResetPasswords] = useState(false);
  const [selectedRowIds, setSelectedRowIds] = useState<string[]>([]);

  const load = useCallback(async () => {
    try {
      setErrorKey(null);
      setErrorMessage(null);
      const data = await accountService.getUserImports(workspaceSlug);
      setBatches(data?.results ?? []);
    } catch {
      setErrorKey("research.user_import.error.load");
    } finally {
      setLoading(false);
    }
  }, [workspaceSlug]);

  useEffect(() => {
    void load();
  }, [load]);

  const runImport = useCallback(async () => {
    setErrorMessage(null);
    setErrorKey(null);
    setActiveBatch(null);
    const students = studentInput.current?.files?.[0];
    const advisors = advisorInput.current?.files?.[0];
    if (!students || !advisors) {
      setErrorKey("research.user_import.error.no_file");
      return;
    }
    if (submitting.current) return;
    submitting.current = true;
    setBusy(true);
    try {
      const batch = await accountService.importUsers(workspaceSlug, {
        students,
        advisors,
        reset_passwords: resetPasswords,
      });
      setActiveBatch(batch);
      setErrorKey(null);
      await load();
    } catch (error) {
      const payload = error as { error_code?: string; message?: string } | undefined;
      const knownCodes = [
        "user_import_file_required",
        "user_import_file_invalid",
        "public_workspace_missing",
        "user_import_existing_member",
        "user_import_in_progress",
        "user_import_duplicate_identity",
      ];
      setErrorKey(
        payload?.error_code && knownCodes.includes(payload.error_code)
          ? `research.user_import.error.${payload.error_code}`
          : "research.user_import.error.run"
      );
      setErrorMessage(typeof payload?.message === "string" ? payload.message : null);
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  }, [load, resetPasswords, workspaceSlug]);

  const updateRow = useCallback(
    async (rowId: string, payload: Record<string, unknown>) => {
      if (!activeBatch?.id) return;
      try {
        const row = await accountService.updateUserImportRow(workspaceSlug, activeBatch.id, rowId, payload);
        setActiveBatch((batch) =>
          batch ? { ...batch, rows: batch.rows?.map((item) => (item.id === rowId ? row : item)) } : batch
        );
      } catch {
        setErrorKey("research.user_import.error.run");
      }
    },
    [activeBatch?.id, workspaceSlug]
  );

  const approve = useCallback(async () => {
    if (!activeBatch?.id || !window.confirm(t("research.user_import.confirm.approve"))) return;
    setBusy(true);
    try {
      const batch = await accountService.approveUserImport(workspaceSlug, activeBatch.id);
      setActiveBatch(batch);
      await load();
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("research.user_import.toast.done_title"),
        message: t("research.user_import.toast.done_message"),
      });
    } catch (error) {
      const payload = error as { message?: string } | undefined;
      setErrorMessage(payload?.message ?? null);
      setErrorKey("research.user_import.error.run");
    } finally {
      setBusy(false);
    }
  }, [activeBatch?.id, load, t, workspaceSlug]);

  const bulkExclude = useCallback(async () => {
    if (!activeBatch?.id || !selectedRowIds.length) return;
    setBusy(true);
    try {
      await accountService.bulkExcludeUserImportRows(workspaceSlug, activeBatch.id, selectedRowIds);
      setActiveBatch(await accountService.getUserImport(workspaceSlug, activeBatch.id));
      setSelectedRowIds([]);
    } finally {
      setBusy(false);
    }
  }, [activeBatch?.id, selectedRowIds, workspaceSlug]);

  const reject = useCallback(async () => {
    if (!activeBatch?.id) return;
    const reason = window.prompt(t("research.user_import.confirm.reject"));
    if (!reason) return;
    setBusy(true);
    try {
      setActiveBatch(await accountService.rejectUserImport(workspaceSlug, activeBatch.id, reason));
      await load();
    } finally {
      setBusy(false);
    }
  }, [activeBatch?.id, load, t, workspaceSlug]);

  const openBatch = useCallback(
    async (batchId: string) => {
      try {
        setActiveBatch(await accountService.getUserImport(workspaceSlug, batchId));
      } catch {
        setErrorKey("research.user_import.error.load");
      }
    },
    [workspaceSlug]
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end gap-3 rounded-md border border-subtle p-3">
        <label className="flex flex-col gap-1 text-11 text-tertiary">
          {t("research.user_import.fields.students")}
          <input
            ref={studentInput}
            type="file"
            accept=".csv,.xlsx"
            disabled={busy}
            className="text-12 text-secondary"
          />
        </label>
        <label className="flex flex-col gap-1 text-11 text-tertiary">
          {t("research.user_import.fields.advisors")}
          <input
            ref={advisorInput}
            type="file"
            accept=".csv,.xlsx"
            required
            disabled={busy}
            className="text-12 text-secondary"
          />
        </label>
        <label className="flex items-center gap-2 text-11 text-tertiary">
          <input
            type="checkbox"
            checked={resetPasswords}
            disabled={busy}
            onChange={(event) => setResetPasswords(event.target.checked)}
          />
          {t("research.user_import.fields.reset_passwords")}
        </label>
        <Button variant="primary" size="sm" loading={busy} disabled={busy} onClick={() => void runImport()}>
          {t("research.user_import.actions.upload")}
        </Button>
      </div>

      <p className="text-11 text-tertiary">{t("research.user_import.hint")}</p>
      <p className="font-mono rounded border border-subtle bg-surface-2 px-3 py-2 text-11 text-secondary">
        姓名, 学号, 邮件, 电话, 年级, 人员类别, 业务方向, 小组, 主导师, 联合导师1, 联合导师2, 备注
      </p>
      {errorKey && (
        <p role="alert" className="text-12 text-danger-primary">
          {t(errorKey)}
          {errorMessage ? ` ${errorMessage}` : ""}
        </p>
      )}

      {activeBatch && (
        <div className="flex flex-col gap-2 rounded-md border border-subtle p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-12 text-primary">
              {activeBatch.status === "IMPORTED"
                ? t("research.user_import.result.committed_title")
                : t("research.user_import.result.review_title")}{" "}
              ·{" "}
              {t("research.user_import.result.counts", {
                total: activeBatch.rows_total,
                ok: activeBatch.rows_ok,
                pending: activeBatch.rows_pending,
                error: activeBatch.rows_error,
              })}
            </div>
            {activeBatch.status === "IMPORTED" && (
              <a
                className="text-12 text-accent-primary"
                href={accountService.getUserImportReportUrl(workspaceSlug, activeBatch.id!)}
                target="_blank"
                rel="noreferrer"
              >
                {t("research.user_import.actions.download_report")}
              </a>
            )}
          </div>
          <div className="max-h-72 overflow-auto rounded border border-subtle">
            <table className="w-full text-11">
              <thead className="bg-surface-2 text-tertiary">
                <tr>
                  <th className="px-2 py-1 text-left">选择</th>
                  <th className="px-2 py-1 text-left">#</th>
                  <th className="px-2 py-1 text-left">{t("research.user_import.columns.name")}</th>
                  <th className="px-2 py-1 text-left">{t("research.user_import.columns.email")}</th>
                  <th className="px-2 py-1 text-left">学号 / 电话 / 年级</th>
                  <th className="px-2 py-1 text-left">{t("research.user_import.columns.category")}</th>
                  <th className="px-2 py-1 text-left">业务方向</th>
                  <th className="px-2 py-1 text-left">{t("research.user_import.columns.primary_org")}</th>
                  <th className="px-2 py-1 text-left">{t("research.user_import.columns.advisors")}</th>
                  <th className="px-2 py-1 text-left">{t("research.user_import.columns.status")}</th>
                  <th className="px-2 py-1 text-left">{t("research.user_import.columns.message")}</th>
                </tr>
              </thead>
              <tbody>
                {(activeBatch.rows ?? []).map((row) => (
                  <tr key={row.id ?? row.row_number} className="border-t border-subtle">
                    <td className="px-2 py-1">
                      <input
                        type="checkbox"
                        aria-label={`选择第 ${row.row_number} 行`}
                        disabled={activeBatch.status !== "PENDING_REVIEW"}
                        checked={Boolean(row.id && selectedRowIds.includes(row.id))}
                        onChange={(event) =>
                          row.id &&
                          setSelectedRowIds((ids) =>
                            event.target.checked ? [...ids, row.id!] : ids.filter((id) => id !== row.id)
                          )
                        }
                      />
                    </td>
                    <td className="px-2 py-1 text-tertiary">{row.row_number}</td>
                    <td className="px-2 py-1 text-primary">
                      <input
                        aria-label={`${row.row_number} name`}
                        className="w-24 rounded border border-subtle bg-transparent px-1"
                        defaultValue={row.display_name}
                        onBlur={(event) => void updateRow(row.id!, { display_name: event.target.value })}
                      />
                    </td>
                    <td className="px-2 py-1 text-secondary">
                      <input
                        type="email"
                        aria-label={`${row.row_number} email`}
                        className="w-44 rounded border border-subtle bg-transparent px-1"
                        defaultValue={row.email}
                        onBlur={(event) => void updateRow(row.id!, { email: event.target.value })}
                      />
                    </td>
                    <td className="px-2 py-1 text-secondary">
                      <div className="grid min-w-32 gap-1">
                        {(["student_no", "phone", "grade"] as const).map((field) => (
                          <input
                            key={field}
                            aria-label={`${row.row_number} ${field}`}
                            className="rounded border border-subtle bg-transparent px-1"
                            defaultValue={row[field]}
                            onBlur={(event) => void updateRow(row.id!, { [field]: event.target.value })}
                          />
                        ))}
                      </div>
                    </td>
                    <td className="px-2 py-1 text-secondary">
                      <input
                        aria-label={`${row.row_number} category`}
                        className="w-24 rounded border border-subtle bg-transparent px-1"
                        defaultValue={row.category || ""}
                        onBlur={(event) => void updateRow(row.id!, { category: event.target.value })}
                      />
                    </td>
                    <td className="px-2 py-1 text-secondary">
                      <input
                        aria-label={`${row.row_number} business category`}
                        className="w-24 rounded border border-subtle bg-transparent px-1"
                        defaultValue={row.business_category}
                        onBlur={(event) => void updateRow(row.id!, { business_category: event.target.value })}
                      />
                    </td>
                    <td className="px-2 py-1 text-secondary">
                      <input
                        aria-label={`${row.row_number} group`}
                        className="w-32 rounded border border-subtle bg-transparent px-1"
                        defaultValue={row.group_label || ""}
                        onBlur={(event) => void updateRow(row.id!, { group_label: event.target.value })}
                      />
                    </td>
                    <td className="px-2 py-1 text-secondary">
                      <div className="grid min-w-72 grid-cols-2 gap-1">
                        {(
                          [
                            ["advisor_name", "primary_advisor_email"],
                            ["co_advisor_1_name", "co_advisor_1_email"],
                            ["co_advisor_2_name", "co_advisor_2_email"],
                          ] as const
                        ).map(([nameField, emailField]) => (
                          <div key={nameField} className="contents">
                            <input
                              aria-label={`${row.row_number} ${nameField}`}
                              className="rounded border border-subtle bg-transparent px-1"
                              defaultValue={row[nameField]}
                              onBlur={(event) => void updateRow(row.id!, { [nameField]: event.target.value })}
                            />
                            <input
                              type="email"
                              aria-label={`${row.row_number} ${emailField}`}
                              className="rounded border border-subtle bg-transparent px-1"
                              defaultValue={row[emailField]}
                              onBlur={(event) => void updateRow(row.id!, { [emailField]: event.target.value })}
                            />
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-2 py-1 text-secondary">
                      <div className="flex items-center gap-1">
                        {t(USER_IMPORT_ROW_STATUS_LABELS[row.status] ?? "research.user_import.status.ok")}
                        {activeBatch.status === "PENDING_REVIEW" && (
                          <>
                            <Button
                              variant={row.review_decision === "INCLUDED" ? "primary" : "secondary"}
                              size="sm"
                              disabled={row.status !== "OK"}
                              onClick={() => void updateRow(row.id!, { review_decision: "INCLUDED" })}
                            >
                              {t("research.user_import.actions.include")}
                            </Button>
                            <Button
                              variant={row.review_decision === "EXCLUDED" ? "primary" : "secondary"}
                              size="sm"
                              onClick={() => void updateRow(row.id!, { review_decision: "EXCLUDED" })}
                            >
                              {t("research.user_import.actions.exclude")}
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-2 py-1 text-tertiary">{row.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {activeBatch.status === "PENDING_REVIEW" && (
            <div className="flex flex-wrap gap-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={busy || !selectedRowIds.length}
                onClick={() => void bulkExclude()}
              >
                {t("research.user_import.actions.bulk_exclude")}
              </Button>
              <Button variant="secondary" size="sm" disabled={busy} onClick={() => void reject()}>
                {t("research.user_import.actions.reject")}
              </Button>
              <Button
                variant="primary"
                size="sm"
                loading={busy}
                disabled={busy || (activeBatch.rows ?? []).some((row) => row.review_decision === "PENDING")}
                onClick={() => void approve()}
              >
                {t("research.user_import.actions.approve")}
              </Button>
            </div>
          )}
        </div>
      )}

      <div className="flex flex-col gap-2">
        <h4 className="text-12 font-medium text-primary">{t("research.user_import.history.title")}</h4>
        {loading ? (
          <div className="flex justify-center py-4">
            <Spinner />
          </div>
        ) : batches.length === 0 ? (
          <p className="text-12 text-tertiary">{t("research.user_import.history.empty")}</p>
        ) : (
          <ul className="flex flex-col gap-1">
            {batches.map((batch) => (
              <li key={batch.id} className="flex items-center justify-between rounded border border-subtle px-3 py-2">
                <button
                  type="button"
                  className="text-left text-12 text-primary hover:text-accent-primary"
                  onClick={() => batch.id && void openBatch(batch.id)}
                >
                  {batch.source_filename || batch.id}
                  <span className="ml-2 text-11 text-tertiary">
                    {batch.dry_run ? t("research.user_import.history.dry_run") : ""} ·{" "}
                    {t("research.user_import.result.counts", {
                      total: batch.rows_total,
                      ok: batch.rows_ok,
                      pending: batch.rows_pending,
                      error: batch.rows_error,
                    })}
                  </span>
                </button>
                <span className="text-11 text-tertiary">
                  {batch.created_at ? new Date(batch.created_at).toLocaleString() : ""}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
});

export default ResearchUserImportPanel;
