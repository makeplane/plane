/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { act, cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BreadcrumbNavigationSelect } from "./breadcrumb-navigation-select";
import type { BreadcrumbNavigationItem, BreadcrumbNavigationSelectProps } from "./breadcrumb-navigation-select";

const PLACEHOLDER = "Project";
const SEARCH_PLACEHOLDER = "Search projects";

function makeItems(overrides: Partial<BreadcrumbNavigationItem>[] = []): BreadcrumbNavigationItem[] {
  const base: BreadcrumbNavigationItem[] = [
    { key: "plane", label: "Plane", onClick: vi.fn() },
    { key: "web", label: "Web app", onClick: vi.fn() },
    { key: "api", label: "API", onClick: vi.fn() },
  ];
  // oxlint-disable-next-line oxc/no-map-spread -- three fixture rows; clarity over allocation
  return base.map((item, index) => ({ ...item, ...overrides[index] }));
}

function renderCrumb(props: Partial<BreadcrumbNavigationSelectProps> = {}) {
  const navigationItems = props.navigationItems ?? makeItems();
  const onChange = vi.fn();
  const handleOnClick = vi.fn();
  render(
    <BreadcrumbNavigationSelect
      navigationItems={navigationItems}
      selectedItemKey="plane"
      placeholder={PLACEHOLDER}
      searchPlaceholder={SEARCH_PLACEHOLDER}
      onChange={onChange}
      handleOnClick={handleOnClick}
      {...props}
    />
  );
  return { navigationItems, onChange, handleOnClick };
}

/** The dropdown is portaled to `<body>`, so option/search queries scope to the document. */
const popup = () => within(document.body);
/**
 * The chevron half of the crumb. It is a plain button until `lazyMount` activates base-ui, and a
 * `combobox` after — and it is named by the property plus the selection, never by its own glyph.
 */
const chevron = (name = `${PLACEHOLDER}, Plane`) =>
  screen.queryByRole("combobox", { name }) ?? screen.getByRole("button", { name });
/** The navigating half: its own control, named by the crumb's label. */
const navigation = (name = "Plane") => screen.getByRole("button", { name });
const search = () => popup().getByRole("combobox", { name: new RegExp(SEARCH_PLACEHOLDER, "i") });

async function open(user: ReturnType<typeof userEvent.setup>) {
  await user.click(chevron());
  await popup().findByRole("combobox", { name: new RegExp(SEARCH_PLACEHOLDER, "i") });
}

describe("BreadcrumbNavigationSelect", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"], shouldAdvanceTime: true });
  });

  afterEach(async () => {
    // Virtualizer scroll-reset callbacks can outlive unmount. Flush them while the DOM still
    // exists, before restoring real timers and letting Vitest tear down the environment.
    cleanup();
    try {
      await act(() => vi.runOnlyPendingTimersAsync());
    } finally {
      vi.useRealTimers();
    }
  });

  it("renders the label and the chevron as two sibling controls", () => {
    renderCrumb();
    const label = navigation();
    const trigger = chevron();
    expect(label).not.toBe(trigger);
    // Neither control may contain the other — that would be a button inside a button.
    expect(label.contains(trigger)).toBe(false);
    expect(trigger.contains(label)).toBe(false);
  });

  it("keeps adjacent controls with independent hover surfaces", () => {
    renderCrumb();
    const pair = chevron().parentElement;
    expect(pair).not.toBeNull();
    expect(pair?.className).not.toContain("hover:bg-");
    expect(navigation().className).toContain("hover:bg-layer-transparent-hover");
    expect(chevron().className).toContain("hover:bg-layer-transparent-hover");
    expect(pair?.className).not.toContain("has-");
    // Both halves live in it, with no gap between them.
    expect(pair?.contains(navigation())).toBe(true);
    expect(pair?.className).not.toContain("gap-");
  });

  it("prefers the caller's label over the selected item's", () => {
    renderCrumb({ label: "Plane (staging)" });
    expect(navigation("Plane (staging)")).toBeDefined();
  });

  it("renders nothing when no item matches and no label is given", () => {
    const { container } = render(
      <BreadcrumbNavigationSelect navigationItems={makeItems()} selectedItemKey="missing" />
    );
    expect(container.innerHTML).toBe("");
  });

  it("navigates to the crumb in one click, without opening the list", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const { handleOnClick, onChange } = renderCrumb();

    await user.click(navigation());

    expect(handleOnClick).toHaveBeenCalledTimes(1);
    expect(onChange).not.toHaveBeenCalled();
    expect(popup().queryByRole("option")).toBeNull();
  });

  it("opens a current crumb from its label without navigating to it", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const { handleOnClick } = renderCrumb({ isLast: true });
    const trigger = chevron();
    expect(trigger.textContent).toBe("Plane");
    expect(trigger.getAttribute("aria-current")).toBe("page");
    expect(screen.queryByRole("button", { name: "Plane" })).toBeNull();
    await user.click(within(trigger).getByText("Plane"));
    await popup().findByRole("option", { name: "Web app" });
    expect(handleOnClick).not.toHaveBeenCalled();
  });

  it("opens the current trigger with Space and restores focus after Escape", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const { handleOnClick } = renderCrumb({ isLast: true });
    chevron().focus();
    await user.keyboard(" ");
    await popup().findByRole("option", { name: "Web app" });
    await user.keyboard("{Escape}");
    await waitFor(() => expect(popup().queryByRole("option")).toBeNull());
    await waitFor(() => expect(document.activeElement).toBe(chevron()));
    expect(handleOnClick).not.toHaveBeenCalled();
  });

  it("keeps a current crumb without options inert on click and keyboard activation", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const { handleOnClick, onChange } = renderCrumb({ isLast: true, navigationDisabled: true });
    const current = navigation();
    expect(current.getAttribute("aria-current")).toBe("page");
    await user.click(current);
    await user.keyboard("{Enter} ");
    expect(handleOnClick).not.toHaveBeenCalled();
    expect(onChange).not.toHaveBeenCalled();
    expect(popup().queryByRole("option")).toBeNull();
    expect(screen.queryByRole("button", { name: "Project, Plane" })).toBeNull();
  });

  it("calls the chosen item's onClick and onChange, not the current row's", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const { navigationItems, onChange, handleOnClick } = renderCrumb();

    await open(user);
    await user.click(await popup().findByRole("option", { name: "Web app" }));

    expect(navigationItems[1].onClick).toHaveBeenCalledTimes(1);
    expect(navigationItems[0].onClick).not.toHaveBeenCalled();
    expect(onChange).toHaveBeenCalledWith("web");
    expect(handleOnClick).not.toHaveBeenCalled();
  });

  it("filters the list through the search field", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderCrumb();

    await open(user);
    await user.type(search(), "API");

    await waitFor(() => expect(popup().queryByRole("option", { name: "Web app" })).toBeNull());
    expect(popup().getByRole("option", { name: "API" })).toBeDefined();
  });

  it("hides the search field when showSearch is false", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderCrumb({ showSearch: false });

    await user.click(chevron());
    await popup().findByRole("option", { name: "Web app" });
    expect(popup().queryByRole("combobox", { name: new RegExp(SEARCH_PLACEHOLDER, "i") })).toBeNull();
  });

  it("drops rows marked shouldRender: false", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderCrumb({ navigationItems: makeItems([{}, { shouldRender: false }]) });

    await open(user);
    await popup().findByRole("option", { name: "API" });
    expect(popup().queryByRole("option", { name: "Web app" })).toBeNull();
  });

  it("ignores a disabled row", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const navigationItems = makeItems([{}, { disabled: true }]);
    const { onChange } = renderCrumb({ navigationItems });

    await open(user);
    const row = await popup().findByRole("option", { name: /Web app/ });
    expect(row.getAttribute("aria-disabled")).toBe("true");

    await user.click(row);

    expect(navigationItems[1].onClick).not.toHaveBeenCalled();
    expect(onChange).not.toHaveBeenCalled();
  });

  it("renders an href-only row as a real link", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderCrumb({ navigationItems: makeItems([{}, { onClick: undefined, href: "/web-app" }]) });

    await open(user);
    const row = await popup().findByRole("option", { name: "Web app" });

    expect(row.tagName).toBe("A");
    expect(row.getAttribute("href")).toBe("/web-app");
  });

  it("keeps a row that has both an href and an onClick a plain, callable option", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    // base-ui's combobox bails out of selection for anything inside an `<a href>`, so a row that has
    // to run a callback must not be an anchor. `onClick` wins and the URL is dropped.
    const navigationItems = makeItems([{}, { href: "/web-app" }]);
    const { onChange } = renderCrumb({ navigationItems });

    await open(user);
    const row = await popup().findByRole("option", { name: "Web app" });
    expect(row.tagName).not.toBe("A");
    expect(row.closest("a")).toBeNull();

    await user.click(row);

    expect(navigationItems[1].onClick).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith("web");
  });

  it("makes the label a link when the crumb only has an href", () => {
    renderCrumb({
      handleOnClick: undefined,
      navigationItems: makeItems([{ onClick: undefined, href: "/plane" }]),
    });

    const link = screen.getByRole("link", { name: "Plane" });
    expect(link.getAttribute("href")).toBe("/plane");
  });

  it("treats picking the current row as navigating to it", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const { navigationItems, onChange, handleOnClick } = renderCrumb();

    await open(user);
    await user.click(await popup().findByRole("option", { name: "Plane" }));

    expect(handleOnClick).toHaveBeenCalledTimes(1);
    expect(navigationItems[0].onClick).not.toHaveBeenCalled();
    expect(onChange).not.toHaveBeenCalled();
  });

  it("opens with the keyboard, arrows through the rows and selects with Enter", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const { navigationItems, onChange } = renderCrumb();

    await user.tab();
    await user.tab();
    expect(document.activeElement).toBe(chevron());

    await user.keyboard("{Enter}");
    await popup().findByRole("option", { name: "Web app" });

    await user.keyboard("{ArrowDown}{ArrowDown}");
    await user.keyboard("{Enter}");

    expect(navigationItems[1].onClick).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith("web");
  });

  it("renders the label alone, with no chevron, when navigation is disabled", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const { handleOnClick } = renderCrumb({ navigationDisabled: true });

    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(1);
    // The one button is the label, not a `breadcrumb` chrome promising a dropdown that is not there.
    expect(buttons[0].querySelector("svg")).toBeNull();

    await user.click(buttons[0]);

    expect(handleOnClick).toHaveBeenCalledTimes(1);
    expect(popup().queryByRole("option")).toBeNull();
  });

  it("keeps a suffix outside both controls", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const onSuffixClick = vi.fn();
    renderCrumb({ suffix: <button onClick={onSuffixClick}>Favorite</button> });

    await user.click(screen.getByRole("button", { name: "Favorite" }));

    expect(onSuffixClick).toHaveBeenCalledTimes(1);
    expect(popup().queryByRole("option")).toBeNull();
  });
});
