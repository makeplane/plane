// @vitest-environment jsdom
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import translations from "../../../../packages/i18n/src/locales/zh-CN/common.json";

const service = vi.hoisted(() => ({
  getUserImports: vi.fn().mockResolvedValue({ results: [] }),
  getAccountProvisioningOptions: vi.fn().mockResolvedValue({ org_units: [], advisors: [], profile_categories: [] }),
  previewUserImport: vi.fn(),
  importUsers: vi.fn(),
  updateUserImportRow: vi.fn(),
  approveUserImport: vi.fn(),
  rejectUserImport: vi.fn(),
  bulkUpdateUserImportRows: vi.fn(),
  bulkExcludeUserImportRows: vi.fn(),
  getUserImport: vi.fn(),
  getUserImportReportUrl: vi.fn().mockReturnValue("/report.csv"),
  createSingleImport: vi.fn(),
}));
vi.mock("@/services/research/account.service", () => ({
  ResearchAccountService: class {
    getUserImports = service.getUserImports;
    getAccountProvisioningOptions = service.getAccountProvisioningOptions;
    previewUserImport = service.previewUserImport;
    importUsers = service.importUsers;
    updateUserImportRow = service.updateUserImportRow;
    approveUserImport = service.approveUserImport;
    rejectUserImport = service.rejectUserImport;
    bulkUpdateUserImportRows = service.bulkUpdateUserImportRows;
    bulkExcludeUserImportRows = service.bulkExcludeUserImportRows;
    getUserImport = service.getUserImport;
    getUserImportReportUrl = service.getUserImportReportUrl;
    createSingleImport = service.createSingleImport;
  },
}));
vi.mock("mobx-react", () => ({ observer: (component: unknown) => component }));
vi.mock("@plane/constants", () => ({ USER_IMPORT_ROW_STATUS_LABELS: {} }));
vi.mock("@plane/i18n", () => ({
  useTranslation: () => ({
    t: (key: string, values?: Record<string, string | number>) => {
      const translated =
        key.split(".").reduce<unknown>((value, part) => (value as Record<string, unknown>)?.[part], translations) ??
        key;
      return Object.entries(values ?? {}).reduce(
        (text, [name, value]) => text.replace(`{${name}}`, String(value)),
        String(translated)
      );
    },
  }),
}));
vi.mock("@plane/propel/button", () => ({
  Button: ({ children, onClick, disabled, type = "button" }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button type={type} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  ),
}));
vi.mock("@plane/propel/toast", () => ({ TOAST_TYPE: {}, setToast: vi.fn() }));
vi.mock("@plane/ui", () => ({ Spinner: () => null }));

import { ResearchUserImportPanel } from "@/components/research/settings/system/user-import-panel";

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true, React });
const container = document.createElement("div");
document.body.append(container);
let root: ReturnType<typeof createRoot>;
beforeEach(() => {
  vi.resetAllMocks();
  service.getUserImports.mockResolvedValue({ results: [] });
  service.getAccountProvisioningOptions.mockResolvedValue({ org_units: [], advisors: [], profile_categories: [] });
  service.getUserImportReportUrl.mockReturnValue("/report.csv");
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
  );
});
afterEach(async () => {
  await act(async () => root.unmount());
  vi.clearAllMocks();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

const batch = {
  id: "batch-1",
  source_filename: "students.xlsx",
  status: "PENDING_REVIEW",
  rows_total: 1,
  rows_ok: 1,
  rows_pending: 0,
  rows_error: 0,
  rows: [
    {
      id: "row-1",
      row_number: 2,
      display_name: "学生",
      email: "student@example.com",
      status: "OK",
      review_decision: "PENDING",
      student_no: "1",
      phone: "123",
      grade: "25",
      business_category: "BASIC_RESEARCH",
      advisor_name: "导师",
      primary_advisor_email: "advisor@example.com",
    },
  ],
};

function button(label: string) {
  return Array.from(container.querySelectorAll("button")).find((item) => item.textContent === label)!;
}

async function change(input: HTMLInputElement | HTMLSelectElement, value: string) {
  await act(async () => {
    const prototype = input instanceof HTMLSelectElement ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(prototype, "value")!.set!.call(input, value);
    input.dispatchEvent(new Event(input instanceof HTMLSelectElement ? "change" : "input", { bubbles: true }));
  });
}

function labeledControl(label: string) {
  return Array.from(container.querySelectorAll("label"))
    .find((item) => item.firstChild?.textContent?.trim() === label)!
    .querySelector("input,select") as HTMLInputElement | HTMLSelectElement;
}

async function upload() {
  root = createRoot(container);
  await act(async () => root.render(<ResearchUserImportPanel workspaceSlug="lab" />));
  container.querySelectorAll('input[type="file"]').forEach((input, index) => {
    Object.defineProperty(input, "files", {
      value: [new File(["xlsx"], index === 0 ? "π-Lab学生-导入信息表.xlsx" : "导师信息表.xlsx")],
    });
  });
  await act(async () => button("上传并预览").click());
}

describe("member import errors", () => {
  it("shows saving feedback and only marks a row included after server confirmation", async () => {
    service.importUsers.mockResolvedValueOnce(batch);
    let finish!: (value: unknown) => void;
    service.updateUserImportRow.mockReturnValueOnce(
      new Promise((resolve) => {
        finish = resolve;
      })
    );
    await upload();
    await act(async () => button("纳入").click());
    expect(container.textContent).toContain("保存中…");
    expect(container.querySelector("tbody")?.textContent).toContain("待审核");
    expect(button("审批导入").disabled).toBe(true);

    await act(async () =>
      finish({
        batch_detail: {
          ...batch,
          rows: [{ ...batch.rows[0], review_decision: "INCLUDED" }],
        },
      })
    );
    expect(service.updateUserImportRow).toHaveBeenCalledWith("lab", "batch-1", "row-1", {
      review_decision: "INCLUDED",
    });
    expect(container.querySelector("tbody")?.textContent).toContain("已纳入 · 未导入");
    expect(container.textContent).toContain("已保存");
    expect(button("纳入").disabled).toBe(true);
    expect(button("审批导入").disabled).toBe(false);
    expect(service.approveUserImport).not.toHaveBeenCalled();
  });

  it("preserves the pending decision and allows retry when inclusion fails", async () => {
    service.importUsers.mockResolvedValueOnce(batch);
    service.updateUserImportRow.mockRejectedValueOnce({ message: "保存失败，网络中断" });
    await upload();
    await act(async () => button("纳入").click());
    expect(container.querySelector('[role="alert"]')?.textContent).toContain("网络中断");
    expect(container.querySelector("tbody")?.textContent).toContain("待审核");
    expect(container.querySelector("tbody")?.textContent).not.toContain("已纳入");
    expect(container.textContent).not.toContain("已保存");
    expect(button("纳入").disabled).toBe(false);
    expect(button("审批导入").disabled).toBe(true);
  });

  it("clears selection when searching or filtering and selects only visible results", async () => {
    service.importUsers.mockResolvedValueOnce({
      ...batch,
      rows_total: 3,
      rows_ok: 3,
      rows: [
        batch.rows[0],
        {
          ...batch.rows[0],
          id: "row-2",
          row_number: 3,
          display_name: "李同学",
          email: "li@example.com",
          review_decision: "INCLUDED",
        },
        {
          ...batch.rows[0],
          id: "row-3",
          row_number: 4,
          display_name: "王同学",
          email: "wang@example.com",
          review_decision: "EXCLUDED",
        },
      ],
    });
    await upload();
    const all = container.querySelector('input[aria-label="全选"]') as HTMLInputElement;
    const search = container.querySelector('input[aria-label="搜索导入人员"]') as HTMLInputElement;
    const filter = container.querySelector('select[aria-label="审核状态筛选"]') as HTMLSelectElement;
    await act(async () => all.click());
    expect(container.textContent).toContain("已选择 3 行");
    await change(search, "LI@EXAMPLE.COM");
    expect(container.textContent).toContain("已选择 0 行");
    expect(container.querySelectorAll("tbody tr")).toHaveLength(1);
    await act(async () => all.click());
    expect(container.querySelectorAll("tbody input:checked")).toHaveLength(1);
    await change(search, "");
    expect(container.textContent).toContain("已选择 0 行");
    await act(async () => all.click());
    await change(filter, "EXCLUDED");
    expect(container.textContent).toContain("已选择 0 行");
    expect(container.querySelector("tbody")?.textContent).toContain("王同学");
    await act(async () => all.click());
    service.bulkUpdateUserImportRows.mockResolvedValueOnce({
      updated: 1,
      batch: { ...batch, rows: [{ ...batch.rows[0], review_decision: "INCLUDED" }] },
    });
    await act(async () => button("批量纳入").click());
    expect(service.bulkUpdateUserImportRows).toHaveBeenCalledWith("lab", "batch-1", ["row-3"], "INCLUDED");
  });

  it("keeps edits local until save and returns the changed included row to pending review", async () => {
    const included = { ...batch, rows: [{ ...batch.rows[0], review_decision: "INCLUDED" }] };
    service.importUsers.mockResolvedValueOnce(included);
    await upload();
    await act(async () => button("编辑").click());
    await change(labeledControl("电话"), "18812345678");
    expect(service.updateUserImportRow).not.toHaveBeenCalled();
    expect(button("审批导入").disabled).toBe(true);
    await act(async () => button("取消").click());
    expect(service.updateUserImportRow).not.toHaveBeenCalled();
    expect(button("审批导入").disabled).toBe(false);
    await act(async () => button("编辑").click());
    expect(labeledControl("电话").value).toBe("123");
    await change(labeledControl("电话"), "18812345678");
    service.updateUserImportRow.mockResolvedValueOnce({
      batch_detail: {
        ...batch,
        rows: [{ ...batch.rows[0], phone: "18812345678" }],
      },
    });
    await act(async () => button("保存").click());
    expect(service.updateUserImportRow).toHaveBeenCalledWith(
      "lab",
      "batch-1",
      "row-1",
      expect.objectContaining({ phone: "18812345678" })
    );
    expect(container.querySelector("form")).toBeNull();
    expect(container.querySelector("tbody")?.textContent).toContain("待审核");
    expect(button("审批导入").disabled).toBe(true);
  });

  it("submits a standalone advisor without student-only fields and opens pending review", async () => {
    service.getAccountProvisioningOptions.mockResolvedValueOnce({
      org_units: [
        { id: "org-1", display_path: "学院 / 导师小组", unit_type: "TEAM", business_category: "BASIC_RESEARCH" },
      ],
      advisors: [],
      profile_categories: [],
    });
    service.createSingleImport.mockResolvedValueOnce({ ...batch, rows: [{ ...batch.rows[0], category: "ADVISOR" }] });
    root = createRoot(container);
    await act(async () => root.render(<ResearchUserImportPanel workspaceSlug="lab" />));
    await act(async () => button("单条录入").click());
    await change(labeledControl("人员类别"), "ADVISOR");
    await change(labeledControl("姓名"), "李导师");
    await change(labeledControl("邮箱"), "li@example.com");
    await change(labeledControl("主归属组织"), "org-1");
    expect(container.textContent).not.toContain("学号");
    expect(container.textContent).not.toContain("选择已有导师");
    await act(async () => button("提交并预览").click());
    expect(service.createSingleImport).toHaveBeenCalledWith("lab", {
      category: "ADVISOR",
      display_name: "李导师",
      email: "li@example.com",
      org_unit: "org-1",
      advisors: [],
    });
    expect(container.querySelector('[aria-label="导入审核"]')?.textContent).toContain("待审核");
    expect(service.approveUserImport).not.toHaveBeenCalled();
  });

  it("selects all rows and includes the selection in one bulk action", async () => {
    const secondRow = {
      ...batch.rows[0],
      id: "row-2",
      row_number: 3,
      email: "student-2@example.com",
    };
    const twoRowBatch = { ...batch, rows_total: 2, rows_ok: 2, rows: [...batch.rows, secondRow] };
    const includedBatch = {
      ...twoRowBatch,
      rows: twoRowBatch.rows.map((row) => ({ ...row, review_decision: "INCLUDED" })),
    };
    service.importUsers.mockResolvedValueOnce(twoRowBatch);
    service.bulkUpdateUserImportRows.mockResolvedValueOnce({ updated: 2, batch: includedBatch });
    await upload();

    const selectAll = container.querySelector('input[aria-label="全选"]') as HTMLInputElement;
    await act(async () => selectAll.click());

    expect(selectAll.checked).toBe(true);
    expect(container.querySelectorAll('tbody input[type="checkbox"]:checked')).toHaveLength(2);
    expect(container.textContent).toContain("已选择 2 行");
    await act(async () => button("批量纳入").click());
    expect(service.bulkUpdateUserImportRows).toHaveBeenCalledWith("lab", "batch-1", ["row-1", "row-2"], "INCLUDED");
    expect(container.textContent).toContain("已纳入");
    expect(container.textContent).toContain("已选择 0 行");
  });

  it("clears all selected rows from the table header", async () => {
    service.importUsers.mockResolvedValueOnce(batch);
    await upload();

    const selectAll = container.querySelector('input[aria-label="全选"]') as HTMLInputElement;
    await act(async () => selectAll.click());
    await act(async () => selectAll.click());

    expect(selectAll.checked).toBe(false);
    expect(container.querySelectorAll('tbody input[type="checkbox"]:checked')).toHaveLength(0);
    expect(button("批量纳入").disabled).toBe(true);
    expect(button("批量排除").disabled).toBe(true);
  });

  it("excludes all selected rows in one bulk action", async () => {
    const excludedBatch = {
      ...batch,
      rows: batch.rows.map((row) => ({ ...row, review_decision: "EXCLUDED" })),
    };
    service.importUsers.mockResolvedValueOnce(batch);
    service.bulkUpdateUserImportRows.mockResolvedValueOnce({ updated: 1, batch: excludedBatch });
    await upload();

    await act(async () => (container.querySelector('input[aria-label="全选"]') as HTMLInputElement).click());
    await act(async () => button("批量排除").click());

    expect(service.bulkUpdateUserImportRows).toHaveBeenCalledWith("lab", "batch-1", ["row-1"], "EXCLUDED");
    expect(container.textContent).toContain("已排除");
  });

  it("shows rejected status and reason in details and history, and locks editing", async () => {
    service.importUsers.mockResolvedValueOnce(batch);
    const rejected = {
      ...batch,
      status: "REJECTED",
      rejection_reason: "导师资料待补充",
      reviewed_at: "2026-09-20T00:00:00Z",
    };
    service.rejectUserImport.mockResolvedValueOnce(rejected);
    await upload();
    service.getUserImports.mockResolvedValueOnce({ results: [rejected] });
    await act(async () => button("驳回批次").click());
    expect(service.rejectUserImport).not.toHaveBeenCalled();
    await change(document.querySelector('input[aria-label="驳回原因"]') as HTMLInputElement, "导师资料待补充");
    await act(async () =>
      Array.from(document.querySelectorAll("button"))
        .find((item) => item.textContent === "确认驳回")!
        .click()
    );
    expect(container.querySelector('[role="status"]')?.textContent).toBe("已驳回 · 未导入");
    expect(container.querySelector("ul")?.textContent).toContain("已驳回 · 未导入");
    expect(container.textContent).toContain("驳回原因：导师资料待补充");
    expect(container.textContent).toContain("校验：通过");
    expect(container.textContent).not.toContain("校验：已导入");
    expect(container.querySelector("fieldset")?.disabled).toBe(true);
    expect(button("审批导入")).toBeUndefined();
  });

  it("shows authoritative review counts in shared import history", async () => {
    service.getUserImports.mockResolvedValueOnce({
      results: [
        {
          ...batch,
          review_counts: { pending: 2, included: 5, excluded: 3 },
        },
      ],
    });
    root = createRoot(container);
    await act(async () => root.render(<ResearchUserImportPanel workspaceSlug="lab" />));

    expect(container.querySelector("ul")?.textContent).toContain("待审核 2 · 已纳入 5 · 已排除 3");
  });

  it("reports rejection errors without pretending the batch was rejected", async () => {
    service.importUsers.mockResolvedValueOnce(batch);
    service.rejectUserImport.mockRejectedValueOnce({ message: "批次状态已变更" });
    await upload();
    await act(async () => button("驳回批次").click());
    await change(document.querySelector('input[aria-label="驳回原因"]') as HTMLInputElement, "修正文件");
    await act(async () =>
      Array.from(document.querySelectorAll("button"))
        .find((item) => item.textContent === "确认驳回")!
        .click()
    );
    expect(container.querySelector('[role="alert"]')?.textContent).toContain("批次状态已变更");
    expect(container.querySelector('[role="status"]')?.textContent).toBe("待审批");
  });

  it("distinguishes approval from validation and displays completed import", async () => {
    const reviewed = { ...batch, rows: [{ ...batch.rows[0], review_decision: "INCLUDED" }] };
    service.importUsers.mockResolvedValueOnce(reviewed);
    service.approveUserImport.mockResolvedValueOnce({ ...reviewed, status: "IMPORTED" });
    await upload();
    expect(container.textContent).toContain("校验通过 1");
    expect(container.textContent).toContain("已纳入");
    service.previewUserImport.mockResolvedValueOnce({
      token: "preview-1",
      included: [{ id: "row-1", name: "学生", email: "student@example.com", advisors: [] }],
      excluded: [],
      advisors: [],
      blockers: [],
    });
    await act(async () => button("审批导入").click());
    const confirm = Array.from(document.querySelectorAll("button")).find(
      (item) => item.textContent === "确认导入 1 名人员"
    )!;
    expect(service.approveUserImport).not.toHaveBeenCalled();
    await act(async () => confirm.click());
    expect(service.approveUserImport).toHaveBeenCalledWith("lab", "batch-1", "preview-1");
    expect(container.querySelector('[role="status"]')?.textContent).toBe("已审批 · 已导入");
    expect(container.textContent).toContain("已导入 1 · 已排除 0");
    expect(container.querySelector("fieldset")?.disabled).toBe(true);
  });

  it("shows the translated file error and the backend explanation", async () => {
    service.importUsers.mockRejectedValueOnce({
      error_code: "user_import_file_invalid",
      message: "学生表缺少列：电话。",
    });
    await upload();
    expect(container.querySelector('[role="alert"]')?.textContent).toBe(
      "文件无法解析，请检查表头与编码。 学生表缺少列：电话。"
    );
    expect(service.importUsers).toHaveBeenCalledWith("lab", expect.not.objectContaining({ dry_run: true }));
  });

  it("uses a readable fallback for unknown error codes", async () => {
    service.importUsers.mockRejectedValueOnce({ error_code: "unexpected_error" });
    await upload();
    expect(container.querySelector('[role="alert"]')?.textContent).toBe("导入失败。");
  });
});
