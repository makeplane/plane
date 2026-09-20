// @vitest-environment jsdom
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import translations from "../../../../packages/i18n/src/locales/zh-CN/common.json";

const service = vi.hoisted(() => ({
  getUserImports: vi.fn().mockResolvedValue({ results: [] }),
  importUsers: vi.fn(),
  updateUserImportRow: vi.fn(),
  approveUserImport: vi.fn(),
  rejectUserImport: vi.fn(),
  bulkExcludeUserImportRows: vi.fn(),
  getUserImport: vi.fn(),
  getUserImportReportUrl: vi.fn().mockReturnValue("/report.csv"),
}));
vi.mock("@/services/research/account.service", () => ({
  ResearchAccountService: class {
    getUserImports = service.getUserImports;
    importUsers = service.importUsers;
    updateUserImportRow = service.updateUserImportRow;
    approveUserImport = service.approveUserImport;
    rejectUserImport = service.rejectUserImport;
    bulkExcludeUserImportRows = service.bulkExcludeUserImportRows;
    getUserImport = service.getUserImport;
    getUserImportReportUrl = service.getUserImportReportUrl;
  },
}));
vi.mock("mobx-react", () => ({ observer: (component: unknown) => component }));
vi.mock("@plane/constants", () => ({ USER_IMPORT_ROW_STATUS_LABELS: {} }));
vi.mock("@plane/i18n", () => ({
  useTranslation: () => ({
    t: (key: string) =>
      key.split(".").reduce<unknown>((value, part) => (value as Record<string, unknown>)?.[part], translations) ?? key,
  }),
}));
vi.mock("@plane/propel/button", () => ({
  Button: ({ children, onClick, disabled }: { children: React.ReactNode; onClick: () => void; disabled?: boolean }) => (
    <button onClick={onClick} disabled={disabled}>
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
afterEach(async () => {
  await act(async () => root.unmount());
  vi.clearAllMocks();
  vi.restoreAllMocks();
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
    vi.spyOn(window, "prompt").mockReturnValue("导师资料待补充");
    await act(async () => button("驳回批次").click());
    expect(container.querySelector('[role="status"]')?.textContent).toBe("已驳回 · 未导入");
    expect(container.querySelector("ul")?.textContent).toContain("已驳回 · 未导入");
    expect(container.textContent).toContain("驳回原因：导师资料待补充");
    expect(container.textContent).toContain("校验：通过");
    expect(container.textContent).not.toContain("校验：已导入");
    expect(container.querySelector("fieldset")?.disabled).toBe(true);
    expect(button("审批导入")).toBeUndefined();
  });

  it("reports rejection errors without pretending the batch was rejected", async () => {
    service.importUsers.mockResolvedValueOnce(batch);
    service.rejectUserImport.mockRejectedValueOnce({ message: "批次状态已变更" });
    await upload();
    vi.spyOn(window, "prompt").mockReturnValue("修正文件");
    await act(async () => button("驳回批次").click());
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
    vi.spyOn(window, "confirm").mockReturnValue(true);
    await act(async () => button("审批导入").click());
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
