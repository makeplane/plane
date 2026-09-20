/** Copyright (c) 2023-present Plane Software, Inc. and contributors. SPDX-License-Identifier: AGPL-3.0-only */
import { useCallback, useEffect, useRef, useState } from "react";
import type { TAccountProvisioningOptions, TUserImportBatch, TUserImportBatchSummary } from "@plane/types";
import { Button } from "@plane/propel/button";
import { ResearchAccountService } from "@/services/research/account.service";
import { SingleImportForm } from "./single-import-form";
import { ImportReview } from "./import-review";

const service = new ResearchAccountService();
const statuses: Record<string, string> = {
  PENDING_REVIEW: "待审批",
  IMPORTED: "已审批 · 已导入",
  REJECTED: "已驳回 · 未导入",
  PENDING: "待处理",
  FAILED: "导入失败",
};

export function ResearchUserImportPanel({
  workspaceSlug,
  onRelationsChanged,
}: {
  workspaceSlug: string;
  onRelationsChanged?: (batch: TUserImportBatch) => Promise<void>;
}) {
  const [mode, setMode] = useState("bulk");
  const [batch, setBatch] = useState<TUserImportBatch | null>(null);
  const [history, setHistory] = useState<TUserImportBatchSummary[]>([]);
  const [options, setOptions] = useState<TAccountProvisioningOptions | null>(null);
  const [busy, setBusy] = useState(false),
    [reviewBusy, setReviewBusy] = useState(false);
  const [loading, setLoading] = useState(true),
    [error, setError] = useState("");
  const students = useRef<HTMLInputElement>(null),
    advisors = useRef<HTMLInputElement>(null);
  const lock = useRef(false);
  useEffect(() => {
    let current = true;
    setLoading(true);
    Promise.all([service.getUserImports(workspaceSlug), service.getAccountProvisioningOptions(workspaceSlug)])
      .then(([data, opts]) => {
        if (current) {
          setHistory(data.results ?? []);
          setOptions(opts);
        }
        return undefined;
      })
      .catch(() => {
        if (current) setError("导入记录或人员候选加载失败，请刷新重试。");
      })
      .finally(() => {
        if (current) setLoading(false);
      });
    return () => {
      current = false;
    };
  }, [workspaceSlug]);
  const accept = useCallback(
    (next: TUserImportBatch) => {
      setBatch(next);
      setHistory((items) => [next, ...items.filter((item) => item.id !== next.id)]);
      if (next.status === "IMPORTED")
        void service
          .getAccountProvisioningOptions(workspaceSlug)
          .then(setOptions)
          .catch(() => setError("人员已导入，候选刷新失败，请刷新页面。"));
    },
    [workspaceSlug]
  );
  const refreshRelations = useCallback(
    async (updatedBatch: TUserImportBatch) => {
      const outcomes = await Promise.allSettled([
        onRelationsChanged?.(updatedBatch) ?? Promise.resolve(),
        service.getAccountProvisioningOptions(workspaceSlug).then(setOptions),
      ]);
      if (outcomes.some((outcome) => outcome.status === "rejected")) {
        setError("人员已写入，但组织成员或候选刷新失败，请刷新页面核对。");
      }
    },
    [onRelationsChanged, workspaceSlug]
  );
  const run = async (operation: () => Promise<void>) => {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      await operation();
    } catch (failure) {
      const payload = failure as { message?: string; error_code?: string };
      setError(
        (payload?.error_code === "user_import_file_invalid" ? "文件无法解析，请检查表头与编码。 " : "") +
          (payload?.message || "导入失败。")
      );
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };
  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2" role="tablist" aria-label="人员录入方式">
        {[
          ["single", "单条录入"],
          ["bulk", "批量导入"],
        ].map(([value, label]) => (
          <button
            key={value}
            role="tab"
            aria-selected={mode === value}
            disabled={busy || reviewBusy}
            className={`rounded px-3 py-2 text-13 ${mode === value ? "bg-surface-2 text-accent-primary" : "text-secondary"}`}
            onClick={() => setMode(value)}
          >
            {label}
          </button>
        ))}
      </div>
      {mode === "single" ? (
        <fieldset disabled={reviewBusy}>
          <SingleImportForm workspaceSlug={workspaceSlug} options={options} onCreated={accept} onBusy={setBusy} />
        </fieldset>
      ) : (
        <>
          <div className="flex flex-wrap items-end gap-3 rounded border border-subtle p-3">
            <label className="text-12">
              成员名册
              <input className="block" ref={students} type="file" accept=".csv,.xlsx" disabled={busy || reviewBusy} />
            </label>
            <label className="text-12">
              导师姓名邮箱表（必传）
              <input className="block" ref={advisors} type="file" accept=".csv,.xlsx" disabled={busy || reviewBusy} />
            </label>
            <Button
              variant="primary"
              size="sm"
              disabled={busy || reviewBusy}
              onClick={() =>
                void run(async () => {
                  const roster = students.current?.files?.[0],
                    mapping = advisors.current?.files?.[0];
                  if (!roster || !mapping) {
                    setError("请先选择成员名册和导师姓名邮箱表。");
                    return;
                  }
                  accept(await service.importUsers(workspaceSlug, { students: roster, advisors: mapping }));
                })
              }
            >
              上传并预览
            </Button>
          </div>
          <p className="text-11 text-tertiary">
            已有工作区成员不能重复录入，可引用已有导师。校验、纳入均不会创建账号；确认审批后才创建人员和组织关系。MS、Ph.D
            按学生导入；电话兼容“手机号”。
          </p>
        </>
      )}
      {error && (
        <p role="alert" className="text-12 text-danger-primary">
          {error}
        </p>
      )}
      {batch && (
        <ImportReview
          key={batch.id}
          batch={batch}
          workspaceSlug={workspaceSlug}
          options={options}
          onChange={accept}
          onBusy={setReviewBusy}
          onRelationsChanged={refreshRelations}
        />
      )}
      <section>
        <h4 className="text-13">最近导入</h4>
        {loading ? (
          <p>加载中…</p>
        ) : !history.length ? (
          <p className="text-12 text-tertiary">暂无导入记录。</p>
        ) : (
          <ul className="mt-2 flex flex-col gap-2">
            {history.map((item) => (
              <li key={item.id} className="rounded border border-subtle p-2">
                <button
                  disabled={busy || reviewBusy}
                  className="text-left text-12"
                  onClick={() => void run(async () => accept(await service.getUserImport(workspaceSlug, item.id!)))}
                >
                  {item.source_filename} · {statuses[item.status]} · 共 {item.rows_total} 行 · 校验通过 {item.rows_ok}
                  {item.review_counts &&
                    ` · 待审核 ${item.review_counts.pending} · 已纳入 ${item.review_counts.included} · 已排除 ${item.review_counts.excluded}`}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
export default ResearchUserImportPanel;
