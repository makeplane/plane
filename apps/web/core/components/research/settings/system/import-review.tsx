import { useRef, useState, useEffect } from "react";
import { Dialog } from "@headlessui/react";
import type { TAccountProvisioningOptions, TUserImportBatch, TUserImportRow } from "@plane/types";
import { Button } from "@plane/propel/button";
import { ResearchAccountService } from "@/services/research/account.service";
import type { ImportApprovalPreview, ImportRelations } from "@/services/research/account.service";

const service = new ResearchAccountService();
const inputClass = "rounded border border-subtle bg-surface-1 px-2 py-1 text-12";
const fields = [
  ["display_name", "姓名"],
  ["email", "邮箱"],
  ["student_no", "学号"],
  ["phone", "电话"],
  ["grade", "年级"],
  ["degree", "学位"],
  ["group_label", "组织完整路径"],
  ["business_category", "业务方向"],
  ["advisor_name", "主导师姓名"],
  ["primary_advisor_email", "主导师邮箱"],
  ["co_advisor_1_name", "联合导师1姓名"],
  ["co_advisor_1_email", "联合导师1邮箱"],
  ["co_advisor_2_name", "联合导师2姓名"],
  ["co_advisor_2_email", "联合导师2邮箱"],
  ["review_note", "备注"],
] as const;
const statuses: Record<string, string> = {
  PENDING_REVIEW: "待审批",
  IMPORTED: "已审批 · 已导入",
  REJECTED: "已驳回 · 未导入",
  PENDING: "待处理",
  FAILED: "导入失败",
};
const decisions: Record<string, string> = { PENDING: "待审核", INCLUDED: "已纳入 · 未导入", EXCLUDED: "已排除" };
const validation: Record<string, string> = { OK: "通过", PENDING: "待修正", ERROR: "失败" };
const actions: Record<string, string> = {
  CREATE: "新建账号",
  JOIN_WORKSPACE: "复用实例账号并加入工作区",
  REFERENCE: "引用已有导师",
};

export function ImportReview({
  batch,
  workspaceSlug,
  options,
  onChange,
  onBusy,
  onRelationsChanged,
}: {
  batch: TUserImportBatch;
  workspaceSlug: string;
  options: TAccountProvisioningOptions | null;
  onChange: (batch: TUserImportBatch) => void;
  onBusy: (busy: boolean) => void;
  onRelationsChanged?: (batch: TUserImportBatch) => Promise<void>;
}) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const [selected, setSelected] = useState<string[]>([]),
    [search, setSearch] = useState(""),
    [filter, setFilter] = useState("ALL");
  const [editing, setEditing] = useState<TUserImportRow | null>(null),
    [savingRow, setSavingRow] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Record<string, string>>({});
  const [preview, setPreview] = useState<ImportApprovalPreview | null>(null),
    [relations, setRelations] = useState<ImportRelations | null>(null);
  const [repairIds, setRepairIds] = useState<string[]>([]);
  const [rejectOpen, setRejectOpen] = useState(false),
    [rejectReason, setRejectReason] = useState("");
  const allInput = useRef<HTMLInputElement>(null),
    lock = useRef(false);
  const editable = batch.status === "PENDING_REVIEW",
    rows = batch.rows ?? [];
  const visible = rows.filter(
    (row) =>
      `${row.display_name} ${row.email}`.toLowerCase().includes(search.toLowerCase()) &&
      (filter === "ALL" || (filter === "INVALID" ? row.status !== "OK" : row.review_decision === filter))
  );
  const ids = visible.flatMap((row) => (row.id ? [row.id] : [])),
    allSelected = ids.length > 0 && ids.every((id) => selected.includes(id));
  const included = rows.filter((row) => row.review_decision === "INCLUDED"),
    pending = rows.filter((row) => row.review_decision === "PENDING"),
    excluded = rows.filter((row) => row.review_decision === "EXCLUDED");
  const blocker = editing
    ? "请先保存或取消资料编辑"
    : savingRow
      ? "正在保存，请稍候"
      : pending.length
        ? `还有 ${pending.length} 行待审核，请纳入或排除`
        : included.some((row) => row.status !== "OK")
          ? "已纳入人员中存在校验问题"
          : !included.length
            ? "没有可导入人员，可驳回批次"
            : "";
  useEffect(() => {
    if (allInput.current) allInput.current.indeterminate = !allSelected && selected.length > 0;
  }, [allSelected, selected]);
  useEffect(() => {
    onBusy(busy || !!editing);
  }, [busy, editing, onBusy]);
  const run = async (operation: () => Promise<void>) => {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      await operation();
    } catch (failure) {
      setError((failure as { message?: string })?.message || "操作失败，请重试。");
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };
  const refresh = async () => onChange(await service.getUserImport(workspaceSlug, batch.id!));
  const update = async (row: TUserImportRow, payload: Record<string, unknown>) => {
    setSavingRow(row.id);
    await run(async () => {
      const result = await service.updateUserImportRow(workspaceSlug, batch.id!, row.id!, payload);
      if (result.batch_detail) onChange(result.batch_detail);
      else await refresh();
      setFeedback((items) => ({ ...items, [row.id!]: "已保存" }));
      setEditing(null);
    });
    setSavingRow(null);
  };
  const bulk = (decision: "INCLUDED" | "EXCLUDED") =>
    run(async () => {
      const result = await service.bulkUpdateUserImportRows(workspaceSlug, batch.id!, selected, decision);
      onChange(result.batch);
      setSelected([]);
    });
  return (
    <section className="flex flex-col gap-3 rounded border border-subtle p-3" aria-label="导入审核">
      <div className="text-13">
        <span role="status">{statuses[batch.status]}</span> · 共 {rows.length} 行 · 校验通过{" "}
        {rows.filter((row) => row.status === "OK").length}
      </div>
      <p className="text-12">
        待审核 {pending.length} · 已纳入 {included.length} · 已排除 {excluded.length} · 问题行{" "}
        {rows.filter((row) => row.status !== "OK").length} · 已选择 {selected.length} 行
      </p>
      {batch.status === "REJECTED" && <p>驳回原因：{batch.rejection_reason || "未填写"}</p>}
      {batch.status === "IMPORTED" && (
        <p>
          已导入 {included.length} · 已排除 {excluded.length}
        </p>
      )}
      {error && (
        <p role="alert" className="text-12 text-danger-primary">
          {error}
        </p>
      )}
      <div className="flex gap-2">
        <input
          className={inputClass}
          aria-label="搜索导入人员"
          placeholder="搜索姓名或邮箱"
          value={search}
          disabled={busy || !!editing}
          onChange={(event) => {
            setSearch(event.target.value);
            setSelected([]);
          }}
        />
        <select
          className={inputClass}
          aria-label="审核状态筛选"
          value={filter}
          disabled={busy || !!editing}
          onChange={(event) => {
            setFilter(event.target.value);
            setSelected([]);
          }}
        >
          {[
            ["ALL", "全部"],
            ["PENDING", "待审核"],
            ["INCLUDED", "已纳入"],
            ["EXCLUDED", "已排除"],
            ["INVALID", "校验问题"],
          ].map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
      <fieldset disabled={busy || !editable || !!editing} className="min-w-0">
        <div className="max-h-96 overflow-auto rounded border border-subtle">
          <table className="w-full text-12">
            <thead className="sticky top-0 z-10 bg-surface-2 text-left">
              <tr>
                <th className="p-2">
                  <label>
                    <input
                      ref={allInput}
                      type="checkbox"
                      aria-label="全选"
                      checked={allSelected}
                      disabled={!ids.length}
                      onChange={() => setSelected(allSelected ? [] : ids)}
                    />{" "}
                    全选筛选结果
                  </label>
                </th>
                <th>姓名 / 邮箱</th>
                <th>审核决定 / 保存状态</th>
                <th>校验</th>
                <th>组织与导师</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((row) => (
                <tr key={row.id} className="border-t border-subtle align-top">
                  <td className="p-2">
                    <input
                      type="checkbox"
                      aria-label={`选择第 ${row.row_number} 行`}
                      checked={!!row.id && selected.includes(row.id)}
                      onChange={(event) =>
                        setSelected(
                          event.target.checked ? [...selected, row.id!] : selected.filter((id) => id !== row.id)
                        )
                      }
                    />{" "}
                    {row.row_number}
                  </td>
                  <td className="p-2">
                    <strong className="block">{row.display_name}</strong>
                    <span className="block text-11 break-all text-tertiary">{row.email}</span>
                    {row.category === "ADVISOR" ? "导师" : "学生"} {row.student_no}
                  </td>
                  <td className="p-2">
                    <span
                      className={`block font-medium whitespace-nowrap ${row.review_decision === "INCLUDED" ? "text-success-primary" : "text-secondary"}`}
                    >
                      {row.review_decision === "EXCLUDED"
                        ? "已排除"
                        : batch.status === "IMPORTED"
                          ? "已导入"
                          : decisions[row.review_decision]}
                    </span>
                    <span aria-live="polite" className="text-11">
                      {savingRow === row.id ? "保存中…" : feedback[row.id!]}
                    </span>
                  </td>
                  <td className="p-2">
                    校验：{validation[row.status]}
                    <p className="max-w-64 text-11 text-danger-primary">{row.status !== "OK" ? row.message : ""}</p>
                  </td>
                  <td className="p-2">
                    <p>{row.group_label}</p>
                    <p className="text-11">
                      {row.advisor_name && `主导师：${row.advisor_name} · ${row.primary_advisor_email}`}
                    </p>
                    <p className="text-11">
                      {[row.co_advisor_1_name, row.co_advisor_2_name].filter(Boolean).join("、")}
                    </p>
                    {batch.status === "IMPORTED" && row.org_unit && (
                      <a
                        className="text-accent-primary"
                        href={`/${workspaceSlug}/research/settings/org?unit=${row.org_unit}`}
                      >
                        查看组织关系
                      </a>
                    )}
                  </td>
                  <td className="p-2">
                    <div className="flex flex-wrap gap-1">
                      {editable && (
                        <>
                          <Button
                            variant={row.review_decision === "INCLUDED" ? "primary" : "secondary"}
                            size="sm"
                            disabled={row.status !== "OK" || row.review_decision === "INCLUDED"}
                            onClick={() => void update(row, { review_decision: "INCLUDED" })}
                          >
                            纳入
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            disabled={row.review_decision === "EXCLUDED"}
                            onClick={() => void update(row, { review_decision: "EXCLUDED" })}
                          >
                            排除
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => setEditing({ ...row })}>
                            编辑
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!visible.length && <p className="p-4 text-12">没有符合筛选条件的记录</p>}
        </div>
      </fieldset>
      {editing && (
        <form
          className="rounded border border-subtle p-3"
          onSubmit={(event) => {
            event.preventDefault();
            void update(editing, Object.fromEntries(fields.map(([key]) => [key, editing[key]])));
          }}
        >
          <p className="mb-2 text-12">编辑 {editing.display_name}。保存资料后需要重新确认纳入。</p>
          <fieldset disabled={busy} className="grid grid-cols-1 gap-2 md:grid-cols-3">
            {fields
              .filter(
                ([key]) =>
                  editing.category !== "ADVISOR" ||
                  ![
                    "student_no",
                    "grade",
                    "degree",
                    "advisor_name",
                    "primary_advisor_email",
                    "co_advisor_1_name",
                    "co_advisor_1_email",
                    "co_advisor_2_name",
                    "co_advisor_2_email",
                  ].includes(key)
              )
              .map(([key, label]) => (
                <label key={key} className="flex flex-col text-11">
                  {label}
                  <input
                    className={inputClass}
                    value={editing[key] || ""}
                    onChange={(event) => setEditing({ ...editing, [key]: event.target.value })}
                  />
                </label>
              ))}
          </fieldset>
          <div className="mt-3 flex gap-2">
            <Button type="submit" variant="primary" size="sm" disabled={busy}>
              保存
            </Button>
            <Button variant="secondary" size="sm" disabled={busy} onClick={() => setEditing(null)}>
              取消
            </Button>
          </div>
        </form>
      )}
      {editable && (
        <div className="sticky bottom-0 flex flex-wrap items-center gap-2 bg-surface-1 py-2">
          <Button
            variant="secondary"
            size="sm"
            disabled={
              busy ||
              !!editing ||
              !selected.length ||
              rows.some((row) => row.id && selected.includes(row.id) && row.status !== "OK")
            }
            onClick={() => void bulk("INCLUDED")}
          >
            批量纳入
          </Button>
          <Button
            variant="secondary"
            size="sm"
            disabled={busy || !!editing || !selected.length}
            onClick={() => void bulk("EXCLUDED")}
          >
            批量排除
          </Button>
          <Button
            variant="secondary"
            size="sm"
            disabled={busy || !!editing}
            onClick={() => {
              setRejectReason("");
              setRejectOpen(true);
            }}
          >
            驳回批次
          </Button>
          <Button
            variant="primary"
            size="sm"
            disabled={busy || !!blocker}
            onClick={() => void run(async () => setPreview(await service.previewUserImport(workspaceSlug, batch.id!)))}
          >
            审批导入
          </Button>
          <span className="text-11 text-tertiary">{blocker || "纳入名单已完成审核，可以核对审批"}</span>
        </div>
      )}
      {batch.status === "IMPORTED" && (
        <div className="flex gap-3 text-12">
          <a className="text-accent-primary" href={service.getUserImportReportUrl(workspaceSlug, batch.id!)}>
            下载导入报告（含新账号初始密码）
          </a>
          <button
            disabled={busy}
            onClick={() =>
              void run(async () => {
                setRelations(await service.checkImportRelations(workspaceSlug, batch.id!));
                setRepairIds([]);
              })
            }
          >
            检查导入关系
          </button>
        </div>
      )}
      <Dialog
        open={rejectOpen}
        onClose={() => {
          if (!busy) setRejectOpen(false);
        }}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-md rounded-lg bg-surface-1 p-5">
            <Dialog.Title className="text-16 font-medium">驳回导入批次</Dialog.Title>
            <p className="mt-2 text-12 text-secondary">驳回后不会创建任何账号或组织关系，请记录明确原因。</p>
            <label className="mt-3 block text-12">
              驳回原因
              <input
                aria-label="驳回原因"
                className={`${inputClass} mt-1 w-full`}
                maxLength={500}
                value={rejectReason}
                onChange={(event) => setRejectReason(event.target.value)}
              />
            </label>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="secondary" size="sm" disabled={busy} onClick={() => setRejectOpen(false)}>
                取消
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={busy || !rejectReason.trim()}
                onClick={() =>
                  void run(async () => {
                    onChange(await service.rejectUserImport(workspaceSlug, batch.id!, rejectReason.trim()));
                    setSelected([]);
                    setRejectOpen(false);
                  })
                }
              >
                确认驳回
              </Button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
      <Dialog
        open={!!preview}
        onClose={() => {
          if (!busy) setPreview(null);
        }}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="flex max-h-full w-full max-w-4xl flex-col gap-3 overflow-auto rounded-lg bg-surface-1 p-5">
            <Dialog.Title className="text-16 font-medium">核对人员与组织关系</Dialog.Title>
            {preview && (
              <>
                <p>
                  纳入 {preview.included.length} 人 · 排除 {preview.excluded.length} 人 · 新建导师{" "}
                  {preview.advisors.filter((item) => item.account_action === "CREATE").length} 人 · 引用已有导师{" "}
                  {preview.advisors.filter((item) => item.account_action === "REFERENCE").length} 人
                </p>
                <ul className="divide-y divide-subtle">
                  {preview.included.map((item) => (
                    <li key={item.id} className="py-2 text-12">
                      <strong>{item.name}</strong> · {item.email} · {actions[item.account_action!]}
                      <p>主归属：{item.org_path}</p>
                      {item.advisors.map((advisor) => (
                        <p key={advisor.email}>
                          {advisor.primary ? "主导师" : "联合导师"}：{advisor.name} · {advisor.email}；小组导师角色
                          {advisor.membership_action === "CREATE" ? "新增" : "保留"}，指导关系
                          {advisor.binding_action === "CREATE" ? "新增" : "保留"}
                        </p>
                      ))}
                    </li>
                  ))}
                </ul>
                {!!preview.excluded.length && (
                  <details>
                    <summary>查看已排除名单（{preview.excluded.length}）</summary>
                    {preview.excluded.map((item) => (
                      <p key={item.id}>
                        {item.name} · {item.email}
                      </p>
                    ))}
                  </details>
                )}
                {preview.advisors.map((advisor) => (
                  <label key={advisor.email} className="flex flex-wrap items-center gap-2 text-12">
                    {advisor.name} · {advisor.email} · {actions[advisor.account_action]}
                    <select
                      aria-label={`${advisor.name}主归属`}
                      className={inputClass}
                      disabled={busy || advisor.primary_locked}
                      value={advisor.primary_org || ""}
                      onChange={(event) => {
                        const value = event.target.value;
                        void run(async () => {
                          const choices = Object.fromEntries(
                            preview.advisors.map((item) => [
                              item.email,
                              item.email === advisor.email ? value : item.primary_org || "",
                            ])
                          );
                          setPreview(await service.previewUserImport(workspaceSlug, batch.id!, choices));
                        });
                      }}
                    >
                      <option value="">主归属待补齐</option>
                      {options?.org_units.map((unit) => (
                        <option key={unit.id} value={unit.id}>
                          {unit.display_path}
                        </option>
                      ))}
                    </select>
                    {advisor.primary_locked && <span>已有主归属，保持不变</span>}
                  </label>
                ))}
                {!!preview.blockers.length && (
                  <p role="alert" className="text-danger-primary">
                    {preview.blockers.join("；")}
                  </p>
                )}
                {error && (
                  <p role="alert" className="text-danger-primary">
                    {error}
                  </p>
                )}
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" disabled={busy} onClick={() => setPreview(null)}>
                    返回审核
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    disabled={busy || !!preview.blockers.length}
                    onClick={() =>
                      void run(async () => {
                        try {
                          const imported = await service.approveUserImport(workspaceSlug, batch.id!, preview.token);
                          onChange(imported);
                          await onRelationsChanged?.(imported);
                          setPreview(null);
                          setSelected([]);
                        } catch (failure) {
                          setPreview(null);
                          throw failure;
                        }
                      })
                    }
                  >
                    确认导入 {preview.included.length} 名人员
                  </Button>
                </div>
              </>
            )}
          </Dialog.Panel>
        </div>
      </Dialog>
      <Dialog
        open={!!relations}
        onClose={() => {
          if (!busy) setRelations(null);
        }}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="max-h-full w-full max-w-3xl overflow-auto rounded-lg bg-surface-1 p-5">
            <Dialog.Title>检查导入关系</Dialog.Title>
            <p className="my-2 text-12">只补齐勾选的缺失关系；已删除、已结束或冲突的关系需人工处理。</p>
            {relations?.items.map((item) => (
              <label key={item.id} className="flex gap-2 border-b border-subtle py-2 text-12">
                <input
                  type="checkbox"
                  disabled={busy || item.status !== "missing"}
                  checked={repairIds.includes(item.id)}
                  onChange={(event) =>
                    setRepairIds(
                      event.target.checked ? [...repairIds, item.id] : repairIds.filter((id) => id !== item.id)
                    )
                  }
                />
                <span>
                  {item.name} · {item.email} · {item.org_path} ·{" "}
                  {
                    (
                      { PRIMARY: "主归属", ADVISOR_ROLE: "小组导师角色", BINDING: "指导关系" } as Record<string, string>
                    )[item.kind]
                  }{" "}
                  {item.mentor_name}
                  <br />
                  {{ missing: "缺失，可补齐", present: "已存在", conflict: "需人工处理" }[item.status]} {item.reason}
                </span>
              </label>
            ))}
            {error && <p role="alert">{error}</p>}
            <div className="mt-3 flex gap-2">
              <Button variant="secondary" size="sm" disabled={busy} onClick={() => setRelations(null)}>
                关闭
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={busy || !repairIds.length}
                onClick={() =>
                  void run(async () => {
                    const repaired = await service.checkImportRelations(workspaceSlug, batch.id!, {
                      preview_token: relations!.token,
                      item_ids: repairIds,
                    });
                    setRelations(repaired);
                    await onRelationsChanged?.(batch);
                    setRepairIds([]);
                  })
                }
              >
                确认补齐 {repairIds.length} 项关系
              </Button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </section>
  );
}
