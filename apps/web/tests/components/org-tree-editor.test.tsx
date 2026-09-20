// @vitest-environment jsdom
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, expect, it, vi } from "vitest";
import translations from "../../../../packages/i18n/src/locales/zh-CN/common.json";

const mocks = vi.hoisted(() => ({
  units: [{ id: "root", name: "public", unit_type: "ROOT", parent: null, depth: 0, business_category: null }],
  createOrgUnit: vi.fn(),
  fetchOrgUnits: vi.fn().mockResolvedValue(undefined),
  getIncomplete: vi.fn().mockResolvedValue(null),
}));
vi.mock("mobx-react", () => ({ observer: (component: unknown) => component }));
vi.mock("@/hooks/store/use-research", () => ({ useResearch: () => ({ ...mocks, getOrgUnits: () => mocks.units }) }));
vi.mock("@/services/research/org.service", () => ({
  ResearchOrgService: class {
    getIncomplete = mocks.getIncomplete;
  },
}));
vi.mock("@/components/research/settings/org/mentor-bindings", () => ({ ResearchMentorBindings: () => null }));
vi.mock("@/components/research/settings/org/org-member-table", () => ({ ResearchOrgMemberTable: () => null }));
vi.mock("@/components/research/common/error-messages", () => ({ getResearchErrorKey: () => "research.common.error" }));
vi.mock("@plane/i18n", () => ({
  useTranslation: () => ({
    t: (key: string) =>
      key.split(".").reduce<unknown>((v, k) => (v as Record<string, unknown>)?.[k], translations) ?? key,
  }),
}));
vi.mock("@plane/propel/button", () => ({
  Button: ({ children, disabled, onClick }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button disabled={disabled} onClick={onClick}>
      {children}
    </button>
  ),
}));
vi.mock("@plane/ui", () => ({ Input: (props: React.InputHTMLAttributes<HTMLInputElement>) => <input {...props} /> }));

import { ResearchOrgTreeEditor } from "@/components/research/settings/org/org-tree-editor";
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true, React });
const container = document.createElement("div");
document.body.append(container);
let root: ReturnType<typeof createRoot>;
afterEach(async () => {
  await act(async () => root.unmount());
  vi.clearAllMocks();
});

async function open() {
  root = createRoot(container);
  await act(async () => root.render(<ResearchOrgTreeEditor workspaceSlug="lab" />));
  expect(container.textContent).not.toContain("新增顶级节点");
  const add = Array.from(container.querySelectorAll("button")).find((b) => b.textContent === "加子节点");
  expect(add).toBeDefined();
  await act(async () => add!.click());
}
async function fill() {
  const input = container.querySelector('[role="dialog"] input') as HTMLInputElement;
  await act(async () => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(input, "器件");
    input.dispatchEvent(new Event("input", { bubbles: true }));
    const select = container.querySelector('[aria-label="业务方向"]') as HTMLSelectElement;
    select.value = "BASIC_RESEARCH";
    select.dispatchEvent(new Event("change", { bubbles: true }));
  });
}
it("creates a TEAM beneath the existing root with an explicit business category", async () => {
  mocks.createOrgUnit.mockResolvedValueOnce({ id: "team" });
  await open();
  expect((container.querySelector('[aria-label="节点类型"]') as HTMLSelectElement).value).toBe("TEAM");
  await fill();
  await act(async () =>
    Array.from(container.querySelectorAll('[role="dialog"] button'))
      .find((b) => b.textContent === "创建")!
      .dispatchEvent(new MouseEvent("click", { bubbles: true }))
  );
  expect(mocks.createOrgUnit).toHaveBeenCalledWith("lab", {
    name: "器件",
    parent: "root",
    unit_type: "TEAM",
    business_category: "BASIC_RESEARCH",
  });
  expect(container.querySelector('[role="dialog"]')).toBeNull();
});
it("keeps failed creation visible with an error in the dialog", async () => {
  mocks.createOrgUnit.mockRejectedValueOnce(new Error("create failed"));
  await open();
  await fill();
  await act(async () =>
    Array.from(container.querySelectorAll('[role="dialog"] button'))
      .find((b) => b.textContent === "创建")!
      .dispatchEvent(new MouseEvent("click", { bubbles: true }))
  );
  expect(container.querySelector('[role="dialog"] [role="alert"]')).not.toBeNull();
});
