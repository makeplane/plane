// @vitest-environment jsdom
import React, { act, useState } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ResearchPersonSelect } from "@/components/research/common/person-select";

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true, React });
const people = [
  { id: "advisor-a", display_name: "李老师", email: "li-a@example.com" },
  { id: "advisor-b", display_name: "李老师", email: "li-b@example.com" },
  { id: "advisor-c", first_name: "王", last_name: "老师", email: "wang@example.com" },
];
let container: HTMLDivElement;
let root: ReturnType<typeof createRoot>;
beforeEach(() => {
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
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
  container.remove();
  vi.unstubAllGlobals();
});

async function render(onChange = vi.fn(), initialValue = "") {
  function Harness() {
    const [selected, setSelected] = useState(initialValue);
    return (
      <ResearchPersonSelect
        people={people}
        value={selected}
        label="选择导师"
        onChange={(id) => {
          setSelected(id);
          onChange(id);
        }}
      />
    );
  }
  await act(async () => root.render(<Harness />));
  return onChange;
}

async function search(value: string) {
  const input = container.querySelector('[role="combobox"]') as HTMLInputElement;
  await act(async () => {
    input.focus();
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(input, value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
  return input;
}

describe("research person selection", () => {
  it("searches by name and keeps duplicate names distinguishable with email and user ID", async () => {
    const changed = await render();
    await search("李老师");
    const options = Array.from(container.querySelectorAll('[role="option"]'));
    expect(options).toHaveLength(2);
    expect(options[0].textContent).toContain("李老师li-a@example.com");
    expect(options[1].textContent).toContain("李老师li-b@example.com");
    await act(async () => options[1].dispatchEvent(new MouseEvent("mousedown", { button: 0, bubbles: true })));
    expect(changed).toHaveBeenLastCalledWith("advisor-b");
    expect((container.querySelector('[role="combobox"]') as HTMLInputElement).value).toBe("李老师 · li-b@example.com");
  });

  it("searches email case-insensitively and supports keyboard selection", async () => {
    const changed = await render();
    const input = await search("WANG@EXAMPLE.COM");
    expect(container.querySelectorAll('[role="option"]')).toHaveLength(1);
    expect(container.querySelector('[role="option"]')?.textContent).toContain("王 老师");
    await act(async () => input.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true })));
    await act(async () => input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true })));
    expect(changed).toHaveBeenLastCalledWith("advisor-c");
    expect(input.value).toBe("王 老师 · wang@example.com");
  });

  it("clears the saved identity while typing and does not submit an unmatched name as a user ID", async () => {
    const changed = await render(vi.fn(), "advisor-a");
    await search("不存在的人员");
    expect(changed).toHaveBeenLastCalledWith("");
    expect(container.querySelectorAll('[role="option"]')).toHaveLength(0);
    expect(container.textContent).toContain("没有匹配的有效成员");
    expect(changed).not.toHaveBeenCalledWith("不存在的人员");
  });
});
