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
  Button: ({ children, onClick }: { children: React.ReactNode; onClick: () => void }) => (
    <button onClick={onClick}>{children}</button>
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
});

async function upload() {
  root = createRoot(container);
  await act(async () => root.render(<ResearchUserImportPanel workspaceSlug="lab" />));
  container.querySelectorAll('input[type="file"]').forEach((input, index) => {
    Object.defineProperty(input, "files", {
      value: [new File(["xlsx"], index === 0 ? "π-Lab学生-导入信息表.xlsx" : "导师信息表.xlsx")],
    });
  });
  const button = Array.from(container.querySelectorAll("button")).find((item) => item.textContent === "上传并预览");
  await act(async () => button!.click());
}

describe("member import errors", () => {
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
