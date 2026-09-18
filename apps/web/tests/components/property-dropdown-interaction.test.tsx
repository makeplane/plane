// @vitest-environment jsdom
import React, { act, useState } from "react";
import { createRoot } from "react-dom/client";
import { Combobox } from "@headlessui/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@plane/i18n", () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
vi.mock("@/hooks/use-platform-os", () => ({ usePlatformOS: () => ({ isMobile: false }) }));
vi.mock("next/navigation", () => ({ useParams: () => ({ workspaceSlug: "workspace" }) }));
vi.mock("@/hooks/store/user", () => ({ useUserPermissions: () => ({ allowPermissions: () => false }) }));
vi.mock("@/hooks/store/use-label", () => ({
  useLabel: () => ({
    getProjectLabels: () => [{ id: "label-1", name: "Bug", color: "#ff0000" }],
    fetchProjectLabels: vi.fn(),
  }),
}));
vi.mock("@/hooks/store/use-cycle", () => ({
  useCycle: () => ({
    getProjectCycleIds: () => ["cycle-1"],
    getCycleById: () => ({ name: "Getting Started", status: "draft" }),
    fetchAllCycles: vi.fn(),
  }),
}));

import { ModuleOptions } from "@/components/dropdowns/module/module-options";
import { CycleOptions } from "@/components/dropdowns/cycle/cycle-options";
import { IssueLabelSelect } from "@/components/issues/issue-detail/label/select/label-select";

function ModuleHarness() {
  const [value, setValue] = useState<string[]>([]);
  return (
    <Combobox value={value} onChange={setValue} multiple>
      <Combobox.Button>Modules</Combobox.Button>
      <ModuleOptions
        isOpen
        multiple
        moduleIds={["module-1"]}
        getModuleById={() => ({ name: "Core Workflow" }) as never}
        referenceElement={null}
        placement={undefined}
        value={value}
      />
    </Combobox>
  );
}

function CycleHarness() {
  const [value, setValue] = useState<string | null>(null);
  return (
    <Combobox value={value} onChange={setValue}>
      <Combobox.Button>Cycles</Combobox.Button>
      <CycleOptions isOpen projectId="project" referenceElement={null} placement={undefined} canRemoveCycle />
    </Combobox>
  );
}

function LabelHarness() {
  const [value, setValue] = useState<string[]>([]);
  return (
    <IssueLabelSelect
      workspaceSlug="workspace"
      projectId="project"
      issueId="issue"
      values={value}
      onSelect={setValue}
      onAddLabel={vi.fn()}
    />
  );
}

describe("work item property dropdown interactions", () => {
  let container: HTMLDivElement;
  let root: ReturnType<typeof createRoot>;

  beforeEach(() => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    vi.stubGlobal(
      "ResizeObserver",
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      }
    );
    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
    vi.unstubAllGlobals();
  });

  const open = async () => {
    await act(async () => {
      const event = new MouseEvent("pointerdown", { bubbles: true, button: 0 });
      Object.defineProperty(event, "pointerType", { value: "mouse" });
      container.querySelector("button")!.dispatchEvent(event);
    });
  };

  const select = async (name: string) => {
    const option = Array.from(container.querySelectorAll<HTMLElement>('[role="option"]')).find(
      (element) => element.textContent === name
    )!;
    expect(option).toBeDefined();
    // jsdom does not block events on inert nodes like a browser does. Check the
    // whole ancestor chain before dispatching so this catches the production bug.
    for (let node: HTMLElement | null = option; node; node = node.parentElement) {
      expect(node.inert, `${name} must remain interactive`).not.toBe(true);
      expect(node.getAttribute("aria-hidden")).not.toBe("true");
    }
    await act(async () => {
      option.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, button: 0, cancelable: true }));
    });
    return option;
  };

  it.each([
    ["modules", ModuleHarness, "Core Workflow"],
    ["labels", LabelHarness, "Bug"],
  ] as const)(
    "can select and deselect %s with the search input inside the menu",
    async (_name, Harness, optionName) => {
      await act(async () => root.render(<Harness />));
      await open();
      expect((await select(optionName)).getAttribute("aria-selected")).toBe("true");
      expect((await select(optionName)).getAttribute("aria-selected")).toBe("false");
    }
  );

  it("can select and remove a cycle", async () => {
    await act(async () => root.render(<CycleHarness />));
    await open();
    expect((await select("Getting Started")).getAttribute("aria-selected")).toBe("true");
    await open();
    expect((await select("cycle.no_cycle")).getAttribute("aria-selected")).toBe("true");
  });
});
