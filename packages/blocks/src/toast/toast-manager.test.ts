/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Structural stand-ins for the Base UI toast payloads, declared locally so the test never imports
 * the module it mocks.
 */
type ToastPayload = {
  title?: string;
  description?: string;
  timeout?: number;
  data?: { variant?: string; actions?: { label: string }[]; primaryAction?: { label: string } };
};
type AddOptions = ToastPayload & { id?: string };
type PromiseOptions = {
  loading: ToastPayload;
  success: (data: { name: string }) => ToastPayload;
  error: (error: unknown) => ToastPayload;
};

// `vi.mock` is hoisted above every `const`, and the module under test builds its manager at import
// time — so the spies have to be created inside `vi.hoisted` to exist by then.
const { add, update, close, promise } = vi.hoisted(() => ({
  add: vi.fn((_options: AddOptions) => "toast-1"),
  update: vi.fn((_id: string, _options: ToastPayload) => undefined),
  close: vi.fn((_id?: string) => undefined),
  promise: vi.fn((value: Promise<unknown>, _options: PromiseOptions) => value),
}));

vi.mock("@makeplane/propel/components/toast", () => ({
  createToastManager: () => ({ add, update, close, promise }),
}));

import { dismissToast, setPromiseToast, setToast, toastManager, updateToast } from "./toast-manager";
import type { ToastActionItem } from "./toast-manager";

/**
 * Stands in for `console.warn`, silenced by default so the drop-path tests don't spam the reporter
 * and asserted where it matters. A plain `vi.fn` rather than `vi.spyOn` so the first argument stays
 * typed as `string` instead of collapsing to `any`.
 */
const warn = vi.fn((_message: string, ..._rest: unknown[]) => undefined);
let originalWarn: typeof console.warn;

beforeEach(() => {
  add.mockClear();
  update.mockClear();
  close.mockClear();
  promise.mockClear();
  warn.mockClear();
  originalWarn = console.warn;
  console.warn = warn;
});

afterEach(() => {
  console.warn = originalWarn;
});

describe("setToast", () => {
  it("maps type to a Propel variant and message to description", () => {
    const id = setToast({ type: "error", title: "Could not save", message: "Try again." });
    expect(id).toBe("toast-1");
    expect(toastManager.add).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Could not save",
        description: "Try again.",
        data: { variant: "danger", actions: undefined },
      })
    );
  });

  it("maps every legacy toast type to a Propel variant", () => {
    const cases = [
      ["success", "success"],
      ["error", "danger"],
      ["warning", "warning"],
      ["info", "info"],
      ["loading-toast", "neutral"],
    ] as const;
    for (const [type, variant] of cases) {
      add.mockClear();
      setToast({ type, title: "Title" });
      expect(add.mock.calls[0][0]).toMatchObject({ data: { variant } });
    }
  });

  it("keeps loading toasts open until dismissed", () => {
    setToast({ type: "loading", title: "Exporting" });
    expect(toastManager.add).toHaveBeenCalledWith(expect.objectContaining({ timeout: 0 }));
    dismissToast("toast-1");
    expect(toastManager.close).toHaveBeenCalledWith("toast-1");
  });

  it("keeps `loading-toast` open until dismissed too", () => {
    setToast({ id: "duplicating-page", type: "loading-toast", title: "Duplicating page..." });
    expect(add.mock.calls[0][0]).toMatchObject({ id: "duplicating-page", timeout: 0 });
  });

  it("omits the `timeout` key entirely for non-loading toasts", () => {
    // Not merely `undefined` — absent. Propel's manager builds `{ priority, timeout: derived,
    // ...options }` on add, so an own `timeout: undefined` would win the spread and wipe the 8s it
    // derives for danger/warning, dropping them to Base UI's 5s default.
    for (const type of ["success", "error", "warning", "info"] as const) {
      add.mockClear();
      setToast({ type, title: "Title" });
      expect(add.mock.calls[0][0]).not.toHaveProperty("timeout");
    }
  });

  it("falls back to a default title for a bare loading toast", () => {
    setToast({ type: "loading" });
    expect(add.mock.calls[0][0]).toMatchObject({ title: "Loading..." });
  });

  it("coerces a numeric legacy id to a string", () => {
    setToast({ id: 42, type: "info", title: "Heads up" });
    expect(add.mock.calls[0][0]).toMatchObject({ id: "42" });
  });

  it("forwards data action items to Propel `data.actions`", () => {
    const onClick = vi.fn();
    setToast({ type: "success", title: "Cycle created", actionItems: [{ label: "View cycle", onClick }] });
    expect(add.mock.calls[0][0]).toMatchObject({ data: { actions: [{ label: "View cycle", onClick }] } });
  });

  it("drops ReactNode action items rather than passing markup to Propel", () => {
    setToast({ type: "success", title: "Page duplicated", actionItems: "View duplicated page" });
    expect(add.mock.calls[0][0].data?.actions).toBeUndefined();
  });

  it("routes a `primary` item to Propel's right-aligned slot and the rest to the left cluster", () => {
    setToast({
      type: "success",
      title: "Work item created",
      actionItems: [
        { label: "Copy link", onClick: vi.fn() },
        { label: "PROJ-1", onClick: vi.fn() },
        { label: "View", href: "/w/p/1", primary: true },
      ],
    });

    const data = add.mock.calls[0][0].data;
    expect(data?.actions?.map((a) => a.label)).toEqual(["Copy link", "PROJ-1"]);
    expect(data?.primaryAction?.label).toBe("View");
    // three items fit across the two slots, so nothing is dropped and nothing is warned about
    expect(warn).not.toHaveBeenCalled();
  });

  it("leaves `primaryAction` unset when no item is flagged", () => {
    setToast({ type: "success", title: "Saved", actionItems: [{ label: "View", href: "/x" }] });
    expect(add.mock.calls[0][0].data?.primaryAction).toBeUndefined();
  });
});

describe("dropped action items", () => {
  // A JSX array is, at runtime, an array of React element objects — no `label` in sight.
  const jsxActionItems = [
    { type: "a", props: { href: "/p/1", children: "View duplicated page" }, key: null },
  ] as unknown as ToastActionItem[];

  it("warns once and drops the actions when `actionItems` is a JSX array", () => {
    setToast({ type: "success", title: "Page duplicated", actionItems: jsxActionItems });

    expect(warn).toHaveBeenCalledTimes(1);
    const message = warn.mock.calls[0][0];
    expect(message).toContain("@plane/blocks/toast");
    expect(message).toContain("actionItems");
    expect(message).toContain("array of 1 non-action value(s)");
    expect(add.mock.calls[0][0].data?.actions).toBeUndefined();
  });

  it("names the value type when `actionItems` is a single element rather than an array", () => {
    setToast({ type: "success", title: "Saved", actionItems: "View page" });
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0][0]).toContain("a value of type string");
  });

  it("warns and truncates when more items are passed than the toast can render", () => {
    setToast({
      type: "success",
      title: "Work item created",
      actionItems: [
        { label: "View", href: "/x" },
        { label: "Copy link", onClick: vi.fn() },
        { label: "PROJ-1", onClick: vi.fn() },
      ],
    });

    expect(warn).toHaveBeenCalledTimes(1);
    const message = warn.mock.calls[0][0];
    expect(message).toContain("@plane/blocks/toast");
    expect(message).toContain("3 action items");
    expect(message).toContain('"PROJ-1"');
    expect(add.mock.calls[0][0].data?.actions?.map((a) => a.label)).toEqual(["View", "Copy link"]);
  });

  it("stays silent for the absent, false and empty cases", () => {
    setToast({ type: "success", title: "A" });
    setToast({ type: "success", title: "B", actionItems: null });
    setToast({ type: "success", title: "C", actionItems: false });
    setToast({ type: "success", title: "D", actionItems: "" });
    setToast({ type: "success", title: "E", actionItems: [] });
    setToast({ type: "success", title: "F", actionItems: [{ label: "View", href: "/x" }] });
    expect(warn).not.toHaveBeenCalled();
  });
});

describe("updateToast", () => {
  it("updates title, description and variant in place", () => {
    updateToast("toast-1", { type: "success", title: "Done", message: "Version restored." });
    expect(toastManager.update).toHaveBeenCalledWith(
      "toast-1",
      expect.objectContaining({
        title: "Done",
        description: "Version restored.",
        data: { variant: "success", actions: undefined },
      })
    );
  });

  it("keeps an updated loading toast open", () => {
    updateToast("restoring-version", { type: "loading-toast", title: "Restoring version..." });
    expect(update.mock.calls[0][1]).toMatchObject({ timeout: 0, data: { variant: "neutral" } });
  });

  it("omits the `timeout` key when settling into a non-loading type", () => {
    // Propel skips its derived timeout on update whenever `Object.hasOwn(options, "timeout")`,
    // which an undefined-valued own property satisfies.
    updateToast("restoring-version", { type: "error", title: "Could not restore version" });
    expect(update.mock.calls[0][1]).not.toHaveProperty("timeout");
  });
});

describe("setPromiseToast", () => {
  it("returns void so call sites stay statements, not floating promises", () => {
    expect(setPromiseToast(Promise.resolve(1), { success: { title: "ok" }, error: { title: "no" } })).toBeUndefined();
  });

  it("wires loading, success and error into the Propel promise options", () => {
    const value = Promise.resolve({ name: "Cycle" });
    setPromiseToast(value, {
      loading: "Creating cycle...",
      success: { title: "Created", message: (data) => `Created ${data.name}` },
      // The legacy API types the error callback against the resolved value; preserved verbatim.
      error: { title: "Failed", message: (error) => `Failed: ${error.name}` },
    });

    expect(promise).toHaveBeenCalledTimes(1);
    const [passedPromise, options] = promise.mock.calls[0];
    expect(passedPromise).toBe(value);
    expect(options.loading).toMatchObject({ title: "Creating cycle...", timeout: 0, data: { variant: "neutral" } });
    expect(options.success({ name: "Cycle" })).toMatchObject({
      title: "Created",
      description: "Created Cycle",
      data: { variant: "success" },
    });
    expect(options.error({ name: "boom" })).toMatchObject({
      title: "Failed",
      description: "Failed: boom",
      data: { variant: "danger" },
    });
  });

  it("keeps `timeout` off the success and error payloads but pins it on loading", () => {
    setPromiseToast(Promise.resolve({ name: "x" }), { success: { title: "ok" }, error: { title: "no" } });
    const options = promise.mock.calls[0][1];
    expect(options.loading).toHaveProperty("timeout", 0);
    expect(options.success({ name: "x" })).not.toHaveProperty("timeout");
    expect(options.error({ name: "x" })).not.toHaveProperty("timeout");
  });

  it("defaults the loading title when the caller omits it", () => {
    setPromiseToast(Promise.resolve(null), { success: { title: "ok" }, error: { title: "no" } });
    expect(promise.mock.calls[0][1].loading).toMatchObject({ title: "Loading..." });
  });
});
