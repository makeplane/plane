// @vitest-environment jsdom
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  rows: [
    {
      id: "manual",
      email: "admin@example.com",
      admin_roles: ["DEV_ADMIN"],
      workspace_memberships: ["public"],
      is_active: true,
      import_source: null,
    },
    {
      id: "student",
      email: "student@example.com",
      admin_roles: [],
      workspace_memberships: ["public"],
      is_active: true,
      import_source: { kind: "ROSTER" },
    },
    {
      id: "inactive",
      email: "inactive@example.com",
      admin_roles: [],
      workspace_memberships: [],
      is_active: false,
      import_source: { kind: "ROSTER" },
    },
  ],
  bulkDeactivate: vi.fn(),
  deactivate: vi.fn(),
  reactivate: vi.fn(),
  clearImported: vi.fn(),
}));
vi.mock("mobx-react", () => ({ observer: (component: unknown) => component }));
vi.mock("swr", () => ({ default: () => ({ data: { results: mocks.rows }, isLoading: false, mutate: vi.fn() }) }));
vi.mock("@plane/services", () => ({
  InstanceUserService: class {
    bulkDeactivate = mocks.bulkDeactivate;
    deactivate = mocks.deactivate;
    reactivate = mocks.reactivate;
    clearImported = mocks.clearImported;
  },
}));
vi.mock("@makeplane/propel/icons", () => ({ LoadingOutline: () => null }));
vi.mock("@makeplane/propel/components/button", () => ({
  Button: ({ label, disabled, onClick }: React.ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) => (
    <button disabled={disabled} onClick={onClick}>
      {label}
    </button>
  ),
}));
vi.mock("@/components/common/page-wrapper", () => ({
  PageWrapper: ({ customHeader, children }: { customHeader: React.ReactNode; children: React.ReactNode }) => (
    <>
      {customHeader}
      {children}
    </>
  ),
}));
vi.mock("@/providers/toast", () => ({ setToast: vi.fn(), TOAST_TYPE: {} }));

import UserRoleManagementPage from "../../app/(all)/(dashboard)/users/page";
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true, React });
const container = document.createElement("div");
document.body.append(container);
let root: ReturnType<typeof createRoot>;
afterEach(async () => {
  await act(async () => root.unmount());
  vi.clearAllMocks();
  vi.restoreAllMocks();
});
async function render() {
  root = createRoot(container);
  const props = {} as React.ComponentProps<typeof UserRoleManagementPage>;
  await act(async () => root.render(<UserRoleManagementPage {...props} />));
}
function button(label: string) {
  return Array.from(container.querySelectorAll("button")).find((b) => b.textContent === label)!;
}
it("explains protected accounts and only selects active imported accounts", async () => {
  await render();
  expect(container.textContent).toContain("管理账号受保护");
  await act(async () => (container.querySelector('[aria-label="全选可删除的导入账号"]') as HTMLInputElement).click());
  expect((container.querySelector('[aria-label="选择 admin@example.com"]') as HTMLInputElement).checked).toBe(false);
  expect((container.querySelector('[aria-label="选择 inactive@example.com"]') as HTMLInputElement).checked).toBe(false);
  mocks.bulkDeactivate.mockResolvedValueOnce({
    success: [],
    skipped: [],
    failed: [{ id: "student", reason: "受保护" }],
  });
  vi.spyOn(window, "confirm").mockReturnValue(true);
  await act(async () => button("批量删除（停用）").click());
  expect(mocks.bulkDeactivate).toHaveBeenCalledWith(["student"]);
  expect(container.querySelector('[role="status"]')?.textContent).toContain("失败 1 个。student@example.com：受保护");
});
it("uses the reversible delete endpoint and a distinct restore confirmation", async () => {
  await render();
  const confirm = vi.spyOn(window, "confirm").mockReturnValue(true);
  await act(async () => button("删除（停用）").click());
  expect(mocks.deactivate).toHaveBeenCalledWith("student");
  expect(container.querySelector('[role="status"]')?.textContent).toContain("账号已删除（停用）");
  await act(async () => button("恢复").click());
  expect(confirm).toHaveBeenLastCalledWith("确认恢复 inactive@example.com？账号将重新启用。");
  expect(mocks.reactivate).toHaveBeenCalledWith("inactive");
});
it("does not delete when confirmation is cancelled", async () => {
  await render();
  vi.spyOn(window, "confirm").mockReturnValue(false);
  await act(async () => button("删除（停用）").click());
  expect(mocks.deactivate).not.toHaveBeenCalled();
});
