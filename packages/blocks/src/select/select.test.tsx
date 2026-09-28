/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { ComponentProps } from "react";
import { useState } from "react";
import { act, cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { TPaginatedResponse } from "@plane/types";
import { Select } from "./select";
import type { SelectPaginationParams } from "./types";

type Option = { id: string; name: string };

const options: Option[] = Array.from({ length: 200 }, (_, i) => ({ id: `id-${i}`, name: `Option ${i}` }));

const TRIGGER_NAME = "Pick";

/** Real callers pass a computed index (`getTabIndex(...).getIndex(...)`), never a literal. */
const FORM_TAB_INDEX = 4;

function renderSelect(extra: Record<string, unknown> = {}, triggerProps: Record<string, unknown> = {}) {
  const onChange = vi.fn();
  const props = {
    getOptionValue: (o: Option) => o.id,
    getOptionLabel: (o: Option) => o.name,
    getValues: () => options,
    value: null,
    onChange,
    placeholder: TRIGGER_NAME,
    searchPlaceholder: "Search options",
    ...extra,
  } as ComponentProps<typeof Select<Option>>;
  const trigger = { variant: "select-md", ...triggerProps } as ComponentProps<typeof Select.Trigger<Option>>;
  render(
    <Select<Option> {...props}>
      <Select.Trigger<Option> {...trigger}>
        <Select.Value />
      </Select.Trigger>
    </Select>
  );
  return { onChange };
}

/** The panel is portaled to `<body>`, so option/search queries scope to the document, not the canvas. */
const popup = () => within(document.body);
/**
 * The closed field, named by whatever `Select.Value` renders into it — the placeholder while
 * nothing is selected, the selection's label otherwise. It is a plain button in the `lazyMount`
 * resting state and a `combobox` once base-ui has taken over, so match either.
 */
const trigger = (name: string = TRIGGER_NAME) =>
  screen.queryByRole("combobox", { name }) ?? screen.getByRole("button", { name });
const search = () => popup().getByRole("combobox", { name: /search options/i });

async function openSelect(user: ReturnType<typeof userEvent.setup>, name?: string) {
  await user.click(trigger(name));
  await popup().findByRole("combobox", { name: /search options/i });
}

describe("Select on Propel combobox", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"], shouldAdvanceTime: true });
  });

  afterEach(async () => {
    // Virtualizer scroll-reset callbacks can outlive unmount. Flush them before jsdom removes
    // window so pending React updates cannot escape the test environment.
    cleanup();
    try {
      await act(() => vi.runOnlyPendingTimersAsync());
    } finally {
      vi.useRealTimers();
    }
  });

  it("opens, filters by search, and selects", async () => {
    const user = userEvent.setup();
    const { onChange } = renderSelect();

    await openSelect(user);
    await user.type(search(), "Option 199");
    await user.click(await popup().findByRole("option", { name: "Option 199" }));

    expect(onChange).toHaveBeenCalledWith("id-199");
  });

  it("virtualizes long lists", async () => {
    const user = userEvent.setup();
    renderSelect();

    await openSelect(user);
    await waitFor(() => expect(popup().getAllByRole("option").length).toBeGreaterThan(0));
    expect(popup().getAllByRole("option").length).toBeLessThan(60);
  });

  it("shows the empty message when nothing matches", async () => {
    const user = userEvent.setup();
    renderSelect({ emptyMessage: "Nothing here" });

    await openSelect(user);
    await user.type(search(), "zzzz");
    expect(await popup().findByText("Nothing here")).toBeDefined();
    expect(popup().queryAllByRole("option")).toHaveLength(0);
  });

  it("selects a row the keyboard walked past the rendered window", async () => {
    const user = userEvent.setup();
    const { onChange } = renderSelect();

    await openSelect(user);
    // 25 rows is past the first virtual window, so this only works if the highlighted index is
    // scrolled back into the rendered set before Enter looks for its element.
    // oxlint-disable-next-line no-await-in-loop -- keystrokes must land one after another
    for (let i = 0; i < 25; i++) await user.keyboard("{ArrowDown}");
    await user.keyboard("{Enter}");

    expect(onChange).toHaveBeenCalledWith("id-24");
  });

  it("selects the last row after End", async () => {
    const user = userEvent.setup();
    const { onChange } = renderSelect();

    await openSelect(user);
    await user.keyboard("{ArrowDown}");
    await user.keyboard("{End}");
    await user.keyboard("{Enter}");

    expect(onChange).toHaveBeenCalledWith("id-199");
  });

  it("closes on Escape", async () => {
    const user = userEvent.setup();
    renderSelect();

    await openSelect(user);
    await user.keyboard("{Escape}");

    await waitFor(() => expect(popup().queryByRole("dialog")).toBeNull());
  });

  it("emits every selected id in multi-select", async () => {
    const user = userEvent.setup();
    const { onChange } = renderSelect({ multiple: true, value: [options[1]] });

    await openSelect(user, `${TRIGGER_NAME}, Option 1`);
    await user.click(await popup().findByRole("option", { name: "Option 3" }));

    expect(onChange).toHaveBeenCalledWith(["id-1", "id-3"]);
  });

  it("pins header items above the list", async () => {
    const user = userEvent.setup();
    const headerItems: Option[] = [{ id: "none", name: "No option" }];
    renderSelect({ headerItems });

    await openSelect(user);
    const rendered = popup().getAllByRole("option");
    expect(rendered[0]).toHaveProperty("textContent", "No option");
    // The header item is not repeated further down the list.
    expect(popup().getAllByText("No option")).toHaveLength(1);
  });

  it("pins the selected option to the top on open", async () => {
    const user = userEvent.setup();
    renderSelect({ value: options[150] });

    await openSelect(user, `${TRIGGER_NAME}, Option 150`);
    const rendered = popup().getAllByRole("option");
    expect(rendered[0]).toHaveProperty("textContent", "Option 150");
  });

  it("does not reorder the list when pinSelected is off", async () => {
    const user = userEvent.setup();
    renderSelect({ value: options[150], pinSelected: false });

    await openSelect(user, `${TRIGGER_NAME}, Option 150`);
    const rendered = popup().getAllByRole("option");
    expect(rendered[0]).toHaveProperty("textContent", "Option 0");
  });

  it("resets the query and the loaded pages on close", async () => {
    const user = userEvent.setup();
    const getValues = vi.fn().mockResolvedValue({ results: options.slice(0, 5), next_page_results: false });
    const onClose = vi.fn();
    renderSelect({ infinite: true, getValues, onClose });

    await openSelect(user);
    await user.type(search(), "Option 1");
    await waitFor(() => expect(search()).toHaveProperty("value", "Option 1"));

    await user.keyboard("{Escape}");
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));

    // Reopening starts from a blank query and refetches page 1 rather than reusing stale rows.
    const callsBeforeReopen = getValues.mock.calls.length;
    await openSelect(user);
    expect(search()).toHaveProperty("value", "");
    await waitFor(() => expect(getValues.mock.calls.length).toBeGreaterThan(callsBeforeReopen));
    expect(getValues.mock.calls.at(-1)?.[0]).toMatchObject({ search: undefined });
  });

  it("loads exactly one more page when the sentinel is visible", async () => {
    const user = userEvent.setup();
    const getValues = vi
      .fn()
      .mockResolvedValueOnce({ results: options.slice(0, 20), next_cursor: "20:1:0", next_page_results: true })
      .mockResolvedValueOnce({ results: options.slice(20, 40), next_cursor: null, next_page_results: false });
    renderSelect({ infinite: true, getValues });

    await openSelect(user);
    // The second page reports no more results, so the sentinel unmounts and paging stops there.
    await waitFor(() => expect(getValues.mock.settledResults).toHaveLength(2));
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(getValues).toHaveBeenCalledTimes(2);
  });

  it("keeps paging when a page is too short to push the sentinel out of view", async () => {
    const user = userEvent.setup();
    // Three short pages: the sentinel stays intersecting throughout, so each append has to re-arm
    // the observer. Two pages would pass even unarmed — the first `hasMore` flip arms it once.
    const page = (start: number, hasNext: boolean) => ({
      results: options.slice(start, start + 3),
      next_cursor: hasNext ? String(start + 3) : null,
      next_page_results: hasNext,
    });
    const getValues = vi
      .fn()
      .mockResolvedValueOnce(page(0, true))
      .mockResolvedValueOnce(page(3, true))
      .mockResolvedValueOnce(page(6, false));
    renderSelect({ infinite: true, getValues });

    await openSelect(user);
    await waitFor(() => expect(getValues.mock.settledResults).toHaveLength(3));
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(getValues).toHaveBeenCalledTimes(3);
    expect(popup().getAllByRole("option")).toHaveLength(9);
  });

  it("shows the loading row while an appended page is in flight", async () => {
    const user = userEvent.setup();
    // oxlint-disable-next-line unicorn/consistent-function-scoping -- no-op until the pending promise installs its resolver
    let releaseSecondPage: () => void = () => {};
    const secondPage = new Promise((resolve) => {
      releaseSecondPage = () =>
        resolve({ results: options.slice(20, 40), next_cursor: null, next_page_results: false });
    });
    const getValues = vi
      .fn()
      .mockResolvedValueOnce({ results: options.slice(0, 20), next_cursor: "20:1:0", next_page_results: true })
      .mockReturnValueOnce(secondPage);
    renderSelect({ infinite: true, getValues });

    await openSelect(user);
    // The sentinel has fired and the append is still pending: the loader row is up.
    await waitFor(() => expect(getValues).toHaveBeenCalledTimes(2));
    expect(popup().getByRole("status", { name: "Loading options" })).toBeDefined();

    releaseSecondPage();
    await waitFor(() => expect(popup().queryByRole("status", { name: "Loading options" })).toBeNull());
  });

  it("opens a heading row whenever the option group changes", async () => {
    const user = userEvent.setup();
    const grouped: Option[] = [
      { id: "a-1", name: "Alpha one" },
      { id: "a-2", name: "Alpha two" },
      { id: "b-1", name: "Beta one" },
    ];
    renderSelect({ getValues: () => grouped, getOptionGroup: (o: Option) => o.name.split(" ")[0] });

    await openSelect(user);
    const list = popup().getByRole("listbox");
    expect(within(list).getByText("Alpha")).toBeDefined();
    expect(within(list).getByText("Beta")).toBeDefined();
    // The headings are presentational — the listbox still exposes exactly the three options.
    expect(popup().getAllByRole("option")).toHaveLength(3);
  });

  it("closes the open section for an option with no group, and repeats a group name safely", async () => {
    const user = userEvent.setup();
    // "Beta" reappears after "Alpha" — a name-keyed heading row would collide with the first one —
    // and the loose option belongs to no section at all.
    const grouped: Option[] = [
      { id: "b-1", name: "Beta one" },
      { id: "loose", name: "Loose" },
      { id: "a-1", name: "Alpha one" },
      { id: "b-2", name: "Beta two" },
    ];
    renderSelect({
      getValues: () => grouped,
      getOptionGroup: (o: Option) => (o.id === "loose" ? undefined : o.name.split(" ")[0]),
    });

    await openSelect(user);
    const list = popup().getByRole("listbox");
    // Two "Beta" headings, one per run — and no heading opened for the loose row.
    expect(within(list).getAllByText("Beta")).toHaveLength(2);
    expect(within(list).getAllByText("Alpha")).toHaveLength(1);
    expect(popup().getAllByRole("option")).toHaveLength(4);
  });

  it("selects a grouped row the keyboard walked past the rendered window", async () => {
    const user = userEvent.setup();
    // Headings shift every row below them, so an untranslated option index would scroll to the
    // wrong row — and Enter would find no element for the highlighted one.
    const { onChange } = renderSelect({
      getOptionGroup: (o: Option) => `Group ${Math.floor(Number(o.id.slice(3)) / 20)}`,
    });

    await openSelect(user);
    // oxlint-disable-next-line no-await-in-loop -- keystrokes must land one after another
    for (let i = 0; i < 25; i++) await user.keyboard("{ArrowDown}");
    await user.keyboard("{Enter}");

    expect(onChange).toHaveBeenCalledWith("id-24");
  });

  it("keeps selecting the right option once headings shift the rows", async () => {
    const user = userEvent.setup();
    const grouped: Option[] = [
      { id: "a-1", name: "Alpha one" },
      { id: "b-1", name: "Beta one" },
      { id: "b-2", name: "Beta two" },
    ];
    const { onChange } = renderSelect({
      getValues: () => grouped,
      getOptionGroup: (o: Option) => o.name.split(" ")[0],
    });

    await openSelect(user);
    await user.click(popup().getByRole("option", { name: "Beta two" }));
    expect(onChange).toHaveBeenCalledWith("b-2");
  });

  it("renders the footer slot below the list", async () => {
    const user = userEvent.setup();
    renderSelect({ footer: <span data-testid="select-footer">Berries only</span> });

    await openSelect(user);
    const footer = popup().getByTestId("select-footer");
    expect(footer).toBeDefined();
    // It sits outside the listbox, so it never reads as an option.
    expect(popup().getByRole("listbox").contains(footer)).toBe(false);
  });

  it("reaches the footer slot's chrome with Tab, with the panel still open", async () => {
    const user = userEvent.setup();
    renderSelect({
      footer: (
        <button type="button" data-testid="select-footer-action">
          Create
        </button>
      ),
    });

    await openSelect(user);
    // Mirrors the header case: the slot is outside the list but inside the panel, and the popup is
    // non-modal, so the caller's chrome keeps its natural tab order and does not have to be
    // pointer-only. This is what `SelectProps.header`'s doc means by "the same holds for footer".
    await user.tab();
    expect(document.activeElement).toBe(popup().getByTestId("select-footer-action"));
    expect(document.querySelector("[data-select-popup]")).not.toBeNull();
  });

  it("renders the header slot above the list", async () => {
    const user = userEvent.setup();
    renderSelect({ header: <span data-testid="select-header">AM / PM</span> });

    await openSelect(user);
    const header = popup().getByTestId("select-header");
    // Chrome, not an option: outside the listbox, and above it in document order.
    expect(popup().getByRole("listbox").contains(header)).toBe(false);
    expect(header.compareDocumentPosition(popup().getByRole("listbox")) & Node.DOCUMENT_POSITION_FOLLOWING).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING
    );
    // And outside the scroll region, so it stays put while the list scrolls.
    expect(popup().getByRole("listbox").parentElement?.contains(header)).toBe(false);
  });

  it("keeps the header slot through a search that matches nothing", async () => {
    const user = userEvent.setup();
    renderSelect({ header: <span data-testid="select-header">AM / PM</span>, emptyMessage: "Nothing here" });

    await openSelect(user);
    await user.type(search(), "zzzz");
    expect(await popup().findByText("Nothing here")).toBeDefined();
    // `headerItems` are options and can be filtered; this is chrome and never is.
    expect(popup().getByTestId("select-header")).toBeDefined();
  });

  it("renders the header slot with the search field turned off", async () => {
    const user = userEvent.setup();
    renderSelect({ header: <span data-testid="select-header">AM / PM</span>, showSearch: false });

    await user.click(trigger());
    await waitFor(() => expect(popup().getAllByRole("option").length).toBeGreaterThan(0));
    expect(popup().getByTestId("select-header")).toBeDefined();
    expect(popup().queryByRole("combobox", { name: /search options/i })).toBeNull();
  });

  it("reaches the header slot's chrome with Tab, with the panel still open", async () => {
    const user = userEvent.setup();
    renderSelect({
      header: (
        <button type="button" data-testid="select-header-toggle">
          AM
        </button>
      ),
    });

    await openSelect(user);
    // The slot is outside the list but inside the panel, after the search field in document order,
    // and the popup is non-modal — so the caller's chrome keeps its natural tab order and does not
    // have to be pointer-only (the snooze modal's AM/PM toggle is the live case).
    await user.tab();
    expect(document.activeElement).toBe(popup().getByTestId("select-header-toggle"));
    expect(document.querySelector("[data-select-popup]")).not.toBeNull();
  });

  it("calls onSearchSubmit on Enter when the query matches options but none is highlighted", async () => {
    const user = userEvent.setup();
    const onSearchSubmit = vi.fn();
    const { onChange } = renderSelect({ onSearchSubmit });

    await openSelect(user);
    await user.type(search(), "Option 1  ");
    // The live create-on-Enter shape: the typed name is a prefix of options that DO exist, so the
    // list is non-empty and only the missing highlight makes this a submit. The zero-match branch
    // is the next test's.
    await waitFor(() => expect(popup().getAllByRole("option").length).toBeGreaterThan(0));
    await user.keyboard("{Enter}");

    // Trimmed, and no option was selected in its place.
    expect(onSearchSubmit).toHaveBeenCalledWith("Option 1");
    expect(onChange).not.toHaveBeenCalled();
  });

  it("calls onSearchSubmit on Enter when the query matches no option", async () => {
    const user = userEvent.setup();
    const onSearchSubmit = vi.fn();
    renderSelect({ onSearchSubmit });

    await openSelect(user);
    await user.type(search(), "zzzz");
    await waitFor(() => expect(popup().queryAllByRole("option")).toHaveLength(0));
    await user.keyboard("{Enter}");

    expect(onSearchSubmit).toHaveBeenCalledWith("zzzz");
  });

  it("selects the highlighted row instead of calling onSearchSubmit", async () => {
    const user = userEvent.setup();
    const onSearchSubmit = vi.fn();
    const { onChange } = renderSelect({ onSearchSubmit });

    await openSelect(user);
    await user.type(search(), "Option 19");
    await user.keyboard("{ArrowDown}");
    await user.keyboard("{Enter}");

    expect(onSearchSubmit).not.toHaveBeenCalled();
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it("ignores an empty query on Enter", async () => {
    const user = userEvent.setup();
    const onSearchSubmit = vi.fn();
    renderSelect({ onSearchSubmit });

    await openSelect(user);
    await user.click(search());
    await user.keyboard("{Enter}");

    expect(onSearchSubmit).not.toHaveBeenCalled();
  });

  it("keeps the dropdown open and the query intact after onSearchSubmit", async () => {
    const user = userEvent.setup();
    const onSearchSubmit = vi.fn();
    renderSelect({ onSearchSubmit });

    await openSelect(user);
    await user.type(search(), "Backend");
    await user.keyboard("{Enter}");

    expect(onSearchSubmit).toHaveBeenCalledWith("Backend");
    // Base UI's own Enter handler closes a popup that has no active index — which is exactly the
    // submit case — and the close would then clear the query through `applyOpenSideEffects`.
    // `preventBaseUIHandler` in `handleSearchKeyDown` is what holds the documented contract.
    expect((search() as HTMLInputElement).value).toBe("Backend");
  });

  it("calls onSearchSubmit on Enter from the search-input chips field too", async () => {
    const user = userEvent.setup();
    const onSearchSubmit = vi.fn();
    const onChange = vi.fn();
    render(
      <Select<Option>
        multiple
        getValues={() => options.slice(0, 3)}
        value={[]}
        onChange={onChange}
        getOptionValue={(o) => o.id}
        getOptionLabel={(o) => o.name}
        lazyMount={false}
        showSearch={false}
        placeholder={TRIGGER_NAME}
        searchPlaceholder="Add options"
        onSearchSubmit={onSearchSubmit}
      >
        <Select.Trigger<Option> variant="search-input" />
      </Select>
    );

    // On this variant the chips field IS the search input, and `showSearch={false}` leaves it as
    // the only Enter path the caller has — so the same contract has to hold through
    // `SelectContextValue.search.onKeyDown`.
    const field = screen.getByRole("combobox") as HTMLInputElement;
    await user.click(field);
    await user.type(field, "Backend  ");
    await user.keyboard("{Enter}");

    expect(onSearchSubmit).toHaveBeenCalledWith("Backend");
    expect(onChange).not.toHaveBeenCalled();
    expect(field.value).toBe("Backend  ");
    expect(document.querySelector("[data-select-popup]")).not.toBeNull();
  });
  /**
   * The `search-input` variant, mounted and ready to type into: the chips field IS the search
   * input (so the popup keeps none of its own) and `lazyMount` is off, because the resting button
   * the lazy state renders is not an input at all.
   */
  function renderChipsField(extra: Record<string, unknown> = {}) {
    const onChange = vi.fn();
    const props = {
      multiple: true,
      value: [],
      getValues: () => options,
      onChange,
      getOptionValue: (o: Option) => o.id,
      getOptionLabel: (o: Option) => o.name,
      lazyMount: false,
      showSearch: false,
      placeholder: TRIGGER_NAME,
      searchPlaceholder: "Add options",
      ...extra,
    } as unknown as ComponentProps<typeof Select<Option>>;
    render(
      <Select<Option> {...props}>
        <Select.Trigger<Option> variant="search-input" />
      </Select>
    );
    const field = screen.getByRole("combobox") as HTMLInputElement;
    return { onChange, field };
  }

  /** Click to open, Escape to close: the closed-but-focused field a pick or a chip removal leaves. */
  async function closeWithFocusInField(user: ReturnType<typeof userEvent.setup>, field: HTMLInputElement) {
    await user.click(field);
    await user.keyboard("{Escape}");
    await waitFor(() => expect(document.querySelector("[data-select-popup]")).toBeNull());
  }

  it("mounts a search-input field without `lazyMount={false}`", async () => {
    const user = userEvent.setup();
    // The chips field is a base-ui part with no resting form; under the default lazy mount it used
    // to render outside any Root and throw.
    const { onChange, field } = renderChipsField({ lazyMount: undefined });

    expect(document.querySelector("[data-select-popup]")).toBeNull();
    await user.click(field);
    await user.click(await popup().findByRole("option", { name: "Option 3" }));

    expect(onChange).toHaveBeenCalledWith(["id-3"]);
  });

  it("keeps the first character typed into a closed search-input field", async () => {
    const user = userEvent.setup();
    const { field } = renderChipsField();

    await closeWithFocusInField(user, field);
    await user.keyboard("19");

    // Base UI reports the opening keystroke's `input-change` BEFORE it opens the popup, so a guard
    // that only asks whether the popup is open drops that character and the field reads "9".
    expect(field.value).toBe("19");
    await waitFor(() => expect(document.querySelector("[data-select-popup]")).not.toBeNull());
    expect(await popup().findByRole("option", { name: "Option 19" })).toBeDefined();
    // The row the dropped character's query ("9") would have matched.
    expect(popup().queryByRole("option", { name: "Option 9" })).toBeNull();
  });

  it("keeps the first character typed into a closed single-select search-input field", async () => {
    const user = userEvent.setup();
    const { field } = renderChipsField({ multiple: false, value: null });

    await closeWithFocusInField(user, field);
    await user.keyboard("19");

    expect(field.value).toBe("19");
    expect(await popup().findByRole("option", { name: "Option 19" })).toBeDefined();
    expect(popup().queryByRole("option", { name: "Option 9" })).toBeNull();
  });

  it("sends the first character typed into a closed search-input field to the server search", async () => {
    const user = userEvent.setup();
    const getValues = vi.fn(
      (_params: SelectPaginationParams): Promise<TPaginatedResponse<Option[]>> =>
        Promise.resolve({ results: options.slice(0, 5), next_page_results: false })
    );
    const { field } = renderChipsField({ infinite: true, getValues });

    await closeWithFocusInField(user, field);
    await user.keyboard("ab");

    expect(field.value).toBe("ab");
    // The debounced search carries the whole query, not the tail the guard used to leave behind.
    await waitFor(() => expect(getValues.mock.calls.some(([params]) => params.search === "ab")).toBe(true));
    expect(getValues.mock.calls.every(([params]) => params.search !== "b")).toBe(true);
  });

  it("puts the caller's tab index on the trigger, resting and mounted alike", async () => {
    const user = userEvent.setup();
    renderSelect({}, { tabIndex: FORM_TAB_INDEX });

    expect(trigger().getAttribute("tabindex")).toBe(String(FORM_TAB_INDEX));
    await openSelect(user);
    // base-ui has taken the trigger over; the tab stop survives the swap.
    expect(trigger().getAttribute("tabindex")).toBe(String(FORM_TAB_INDEX));
  });

  it("drops the trailing chevron for an explicit null appendIcon", () => {
    renderSelect({}, { appendIcon: null });
    expect(trigger().querySelectorAll("svg")).toHaveLength(0);
  });

  it("keeps the chevron when no appendIcon is given", () => {
    renderSelect();
    expect(trigger().querySelectorAll("svg").length).toBeGreaterThan(0);
  });

  it("opens on mount with defaultOpen", async () => {
    renderSelect({ defaultOpen: true });
    expect(await popup().findByRole("combobox", { name: /search options/i })).toBeDefined();
  });

  it("raises the popup positioner to the given z-index", async () => {
    const user = userEvent.setup();
    renderSelect({ positionerZIndex: 120 });

    await openSelect(user);
    const positioner = document.querySelector("[data-select-popup]")?.parentElement as HTMLElement | null;
    expect(positioner?.style.zIndex).toBe("120");
  });

  it("shows the error row and retries the fetch when an infinite load fails", async () => {
    const user = userEvent.setup();
    const getValues = vi
      .fn()
      .mockRejectedValueOnce(new Error("boom"))
      .mockResolvedValueOnce({ results: options.slice(0, 3), next_cursor: null, next_page_results: false });
    renderSelect({ infinite: true, getValues, emptyMessage: "No results found" });

    await openSelect(user);
    expect(await popup().findByRole("alert")).toBeDefined();
    // The empty row stands down while the failure is on screen.
    expect(popup().queryByText("No results found")).toBeNull();

    await user.click(popup().getByRole("button", { name: /retry/i }));
    await waitFor(() => expect(getValues).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(popup().queryByRole("alert")).toBeNull());
    expect(popup().getAllByRole("option")).toHaveLength(3);
  });

  it("renders the caller's error copy", async () => {
    const user = userEvent.setup();
    const getValues = vi.fn().mockRejectedValue(new Error("nope"));
    renderSelect({ infinite: true, getValues, errorMessage: (err: unknown) => `Failed: ${(err as Error).message}` });

    await openSelect(user);
    expect(await popup().findByText("Failed: nope")).toBeDefined();
  });

  it("shows the searching line while a search fetch is in flight", async () => {
    const user = userEvent.setup();
    // oxlint-disable-next-line unicorn/consistent-function-scoping -- no-op until the pending promise installs its resolver
    let releaseSearch: () => void = () => {};
    const getValues = vi
      .fn()
      .mockResolvedValueOnce({ results: options.slice(0, 5), next_cursor: null, next_page_results: false })
      .mockReturnValueOnce(
        new Promise((resolve) => {
          releaseSearch = () => resolve({ results: [], next_cursor: null, next_page_results: false });
        })
      );
    renderSelect({ infinite: true, getValues, searchingMessage: "Searching repositories" });

    await openSelect(user);
    await waitFor(() => expect(popup().getAllByRole("option")).toHaveLength(5));

    await user.type(search(), "abc");
    expect(await popup().findByText("Searching repositories")).toBeDefined();

    releaseSearch();
    await waitFor(() => expect(popup().queryByText("Searching repositories")).toBeNull());
  });

  it("says it is searching while the first page loads behind header rows", async () => {
    const user = userEvent.setup();
    // oxlint-disable-next-line unicorn/consistent-function-scoping -- no-op until the pending promise installs its resolver
    let releaseFirstPage: () => void = () => {};
    const getValues = vi.fn().mockReturnValueOnce(
      new Promise((resolve) => {
        releaseFirstPage = () => resolve({ results: options.slice(0, 5), next_cursor: null, next_page_results: false });
      })
    );
    renderSelect({ infinite: true, getValues, headerItems: [{ id: "all", name: "All options" }] });

    await openSelect(user);
    // The header row keeps the list non-empty, which once hid the first-load status entirely.
    expect(await popup().findByRole("option", { name: "All options" })).toBeDefined();
    // Matched loosely: i18n is not initialised here, so `t()` yields the key, and base-ui appends
    // an invisible Word Joiner to a freshly mounted status line to force its announcement.
    expect(await popup().findByText(/searching/i)).toBeDefined();

    releaseFirstPage();
    await waitFor(() => expect(popup().getAllByRole("option")).toHaveLength(6));
    expect(popup().queryByText(/searching/i)).toBeNull();
  });

  it("says it is searching over the previous results while a cleared query reloads", async () => {
    const user = userEvent.setup();
    // oxlint-disable-next-line unicorn/consistent-function-scoping -- no-op until the pending promise installs its resolver
    let releaseReload: () => void = () => {};
    const getValues = vi
      .fn()
      .mockResolvedValueOnce({ results: options.slice(0, 5), next_cursor: null, next_page_results: false })
      .mockResolvedValueOnce({ results: options.slice(0, 2), next_cursor: null, next_page_results: false })
      .mockReturnValueOnce(
        new Promise((resolve) => {
          releaseReload = () => resolve({ results: options.slice(0, 5), next_cursor: null, next_page_results: false });
        })
      );
    renderSelect({ infinite: true, getValues });

    await openSelect(user);
    await waitFor(() => expect(popup().getAllByRole("option")).toHaveLength(5));
    await user.type(search(), "a");
    await waitFor(() => expect(popup().getAllByRole("option")).toHaveLength(2));

    // Clearing reloads instantly, and the rows on screen are the previous query's until it lands.
    await user.clear(search());
    // Matched loosely: i18n is not initialised here, so `t()` yields the key, and base-ui appends
    // an invisible Word Joiner to a freshly mounted status line to force its announcement.
    expect(await popup().findByText(/searching/i)).toBeDefined();
    expect(popup().getAllByRole("option")).toHaveLength(2);

    releaseReload();
    await waitFor(() => expect(popup().getAllByRole("option")).toHaveLength(5));
    expect(popup().queryByText(/searching/i)).toBeNull();
  });

  it("opens from a controlled `open` and reports the user's close", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();

    function Controlled() {
      const [open, setOpen] = useState(false);
      return (
        <>
          <button type="button" onClick={() => setOpen(true)}>
            Open it
          </button>
          <Select<Option>
            open={open}
            onOpenChange={(next) => {
              onOpenChange(next);
              setOpen(next);
            }}
            getValues={() => options}
            value={null}
            onChange={vi.fn()}
            getOptionValue={(o) => o.id}
            getOptionLabel={(o) => o.name}
            placeholder={TRIGGER_NAME}
            searchPlaceholder="Search options"
          >
            <Select.Trigger variant="select-md">
              <Select.Value />
            </Select.Trigger>
          </Select>
        </>
      );
    }
    render(<Controlled />);

    // No click on the trigger: the surface opens it.
    await user.click(screen.getByRole("button", { name: "Open it" }));
    expect(await popup().findByRole("combobox", { name: /search options/i })).toBeDefined();

    await user.keyboard("{Escape}");
    await waitFor(() => expect(popup().queryByRole("combobox", { name: /search options/i })).toBeNull());
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("keeps an unresolved selected id in the payload (Ruling 46)", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    // "ghost" is selected but is not in the list — the option has not paged in, or was deactivated.
    const loaded = options.slice(0, 3);
    const ids = ["ghost", loaded[0].id];
    const byId = new Map(loaded.map((option) => [option.id, option]));
    render(
      <Select<Option>
        multiple
        getValues={() => loaded}
        value={ids.map((id) => byId.get(id) ?? { id, name: id })}
        onChange={onChange}
        getOptionValue={(o) => o.id}
        getOptionLabel={(o) => o.name}
        placeholder={TRIGGER_NAME}
        searchPlaceholder="Search options"
      >
        <Select.Trigger variant="select-md">
          <Select.Value />
        </Select.Trigger>
      </Select>
    );

    await user.click(trigger(`${TRIGGER_NAME}, ghost, ${loaded[0].name}`));
    await popup().findByRole("combobox", { name: /search options/i });
    await user.click(popup().getByRole("option", { name: loaded[1].name }));

    // The unresolved id rides along instead of being reported as a removal.
    expect(onChange).toHaveBeenCalledWith(expect.arrayContaining(["ghost", loaded[0].id, loaded[1].id]));
  });

  it("dims a disabled row and refuses to select it", async () => {
    const user = userEvent.setup();
    const { onChange } = renderSelect({
      getValues: () => options.slice(0, 3),
      getOptionDisabled: (o: Option) => o.id === "id-1",
    });

    await openSelect(user);
    const disabledRow = popup().getByRole("option", { name: "Option 1" });
    expect(disabledRow.getAttribute("data-disabled")).not.toBeNull();
    // propel's shared menu row carries `data-disabled:text-disabled` and
    // `data-disabled:pointer-events-none`, so the row reads dimmed and swallows the press.
    expect(disabledRow.className).toContain("data-disabled:text-disabled");
    expect(disabledRow.className).toContain("data-disabled:pointer-events-none");

    // The enabled neighbour still selects, so the list itself is live.
    await user.click(popup().getByRole("option", { name: "Option 0" }));
    expect(onChange).toHaveBeenCalledWith("id-0");
    onChange.mockClear();

    // `value` stays null (the spy never writes back), so the trigger is named the same on reopen.
    await openSelect(user);
    await user.click(popup().getByRole("option", { name: "Option 1" }));
    expect(onChange).not.toHaveBeenCalled();
  });

  it("announces a disabled row as aria-disabled", async () => {
    const user = userEvent.setup();
    renderSelect({
      getValues: () => options.slice(0, 3),
      getOptionDisabled: (o: Option) => o.id === "id-1",
    });

    await openSelect(user);
    expect(popup().getByRole("option", { name: "Option 1" }).getAttribute("aria-disabled")).toBe("true");
    expect(popup().getByRole("option", { name: "Option 0" }).getAttribute("aria-disabled")).not.toBe("true");
  });

  it("walks the keyboard highlight past disabled rows", async () => {
    const user = userEvent.setup();
    const { onChange } = renderSelect({
      getValues: () => options.slice(0, 5),
      getOptionDisabled: (o: Option) => o.id === "id-1" || o.id === "id-2",
    });

    await openSelect(user);
    await user.keyboard("{ArrowDown}");
    await user.keyboard("{ArrowDown}");
    // Option 1 and Option 2 are skipped, so the second step lands on Option 3.
    await waitFor(() =>
      expect(popup().getByRole("option", { name: "Option 3" }).getAttribute("data-highlighted")).not.toBeNull()
    );
    await user.keyboard("{Enter}");
    expect(onChange).toHaveBeenCalledWith("id-3");
  });

  it("walks back up past disabled rows", async () => {
    const user = userEvent.setup();
    const { onChange } = renderSelect({
      getValues: () => options.slice(0, 5),
      getOptionDisabled: (o: Option) => o.id === "id-1" || o.id === "id-2",
    });

    await openSelect(user);
    await user.keyboard("{ArrowDown}");
    await user.keyboard("{End}");
    await user.keyboard("{ArrowUp}");
    // Option 4 -> Option 3, then past Option 2 and Option 1.
    await user.keyboard("{ArrowUp}");
    await waitFor(() =>
      expect(popup().getByRole("option", { name: "Option 0" }).getAttribute("data-highlighted")).not.toBeNull()
    );
    await user.keyboard("{Enter}");
    expect(onChange).toHaveBeenCalledWith("id-0");
  });

  it("carries End inwards when the last row is disabled", async () => {
    const user = userEvent.setup();
    const { onChange } = renderSelect({
      getValues: () => options.slice(0, 5),
      getOptionDisabled: (o: Option) => o.id === "id-4",
    });

    await openSelect(user);
    await user.keyboard("{ArrowDown}");
    await user.keyboard("{End}");
    await waitFor(() =>
      expect(popup().getByRole("option", { name: "Option 3" }).getAttribute("data-highlighted")).not.toBeNull()
    );
    await user.keyboard("{Enter}");
    expect(onChange).toHaveBeenCalledWith("id-3");
  });

  it("stops walking when every row is disabled", async () => {
    const user = userEvent.setup();
    const { onChange } = renderSelect({
      getValues: () => options.slice(0, 3),
      getOptionDisabled: () => true,
    });

    await openSelect(user);
    await user.keyboard("{ArrowDown}");
    await act(() => vi.runOnlyPendingTimersAsync());
    // The replay loop is bounded: it runs off the end of the list instead of cycling, and Enter
    // with nothing pickable highlighted selects nothing.
    await user.keyboard("{Enter}");
    expect(onChange).not.toHaveBeenCalled();
  });

  it("puts the tab index on the search-input variant's own field", () => {
    render(
      <Select<Option>
        multiple
        getValues={() => options.slice(0, 3)}
        value={[]}
        onChange={vi.fn()}
        getOptionValue={(o) => o.id}
        getOptionLabel={(o) => o.name}
        lazyMount={false}
        showSearch={false}
        placeholder={TRIGGER_NAME}
        searchPlaceholder="Add options"
      >
        <Select.Trigger variant="search-input" tabIndex={FORM_TAB_INDEX} />
      </Select>
    );
    expect(screen.getByRole("combobox").getAttribute("tabindex")).toBe(String(FORM_TAB_INDEX));
  });

  it("keeps header items visible while the query filters everything else", async () => {
    const user = userEvent.setup();
    const allProjects = { id: "all", name: "All projects" };
    renderSelect({ getValues: () => options.slice(0, 5), headerItems: [allProjects] });

    await openSelect(user);
    await user.type(search(), "Option 3");
    const rows = popup().getAllByRole("option");
    expect(rows.map((row) => row.textContent)).toEqual(["All projects", "Option 3"]);
  });

  it("filters header items too when asked", async () => {
    const user = userEvent.setup();
    const allProjects = { id: "all", name: "All projects" };
    renderSelect({ getValues: () => options.slice(0, 5), headerItems: [allProjects], filterHeaderItems: true });

    await openSelect(user);
    await user.type(search(), "Option 3");
    expect(
      popup()
        .getAllByRole("option")
        .map((row) => row.textContent)
    ).toEqual(["Option 3"]);
  });

  it("resolves valueIds against the loaded options and keeps the unresolved ones (Ruling 46)", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const loaded = options.slice(0, 3);
    render(
      <Select<Option>
        multiple
        getValues={() => loaded}
        valueIds={["ghost", loaded[0].id]}
        getOptionPlaceholder={(id) => ({ id, name: id })}
        onChange={onChange}
        getOptionValue={(o) => o.id}
        getOptionLabel={(o) => o.name}
        placeholder={TRIGGER_NAME}
        searchPlaceholder="Search options"
      >
        <Select.Trigger variant="select-md">
          <Select.Value />
        </Select.Trigger>
      </Select>
    );

    // The placeholder is what the trigger draws for the id nothing has loaded.
    await user.click(trigger(`${TRIGGER_NAME}, ghost, ${loaded[0].name}`));
    await popup().findByRole("combobox", { name: /search options/i });
    await user.click(popup().getByRole("option", { name: loaded[1].name }));

    expect(onChange).toHaveBeenCalledWith(expect.arrayContaining(["ghost", loaded[0].id, loaded[1].id]));
  });

  it("keeps an unresolved id in the payload even with no placeholder to draw", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const loaded = options.slice(0, 3);
    render(
      <Select<Option>
        multiple
        getValues={() => loaded}
        valueIds={["ghost"]}
        onChange={onChange}
        getOptionValue={(o) => o.id}
        getOptionLabel={(o) => o.name}
        placeholder={TRIGGER_NAME}
        searchPlaceholder="Search options"
      >
        <Select.Trigger variant="select-md">
          <Select.Value />
        </Select.Trigger>
      </Select>
    );

    await openSelect(user);
    await user.click(popup().getByRole("option", { name: loaded[0].name }));
    expect(onChange).toHaveBeenCalledWith(["ghost", loaded[0].id]);
  });

  /** An infinite ids-in multi-select: the shape Ruling 46 prescribes for a paginated list. */
  function InfiniteIdsIn(props: {
    getValues: (params: { cursor?: string; search?: string }) => Promise<unknown>;
    chips?: boolean;
  }) {
    const [ids, setIds] = useState<string[]>([]);
    const selectProps = {
      multiple: true,
      infinite: true,
      defaultOpen: true,
      // The chips field IS the search input for that variant, so the popup keeps none of its own.
      showSearch: !props.chips,
      getValues: props.getValues,
      valueIds: ids,
      onChange: setIds,
      getOptionValue: (o: Option) => o.id,
      getOptionLabel: (o: Option) => o.name,
      placeholder: TRIGGER_NAME,
      searchPlaceholder: "Search options",
    } as unknown as ComponentProps<typeof Select<Option>>;
    return (
      <Select<Option> {...selectProps}>
        {props.chips ? (
          <Select.Trigger<Option> variant="search-input" />
        ) : (
          <Select.Trigger<Option> variant="select-md">
            <Select.Value />
          </Select.Trigger>
        )}
      </Select>
    );
  }

  it("keeps naming an infinite ids-in selection after the close empties the list", async () => {
    const user = userEvent.setup();
    const loaded = options.slice(0, 3);
    const getValues = vi.fn().mockResolvedValue({ results: loaded, next_page_results: false });
    render(<InfiniteIdsIn getValues={getValues} />);

    await popup().findByRole("combobox", { name: /search options/i });
    await user.click(await popup().findByRole("option", { name: loaded[0].name }));
    await user.keyboard("{Escape}");
    await waitFor(() => expect(popup().queryByRole("combobox", { name: /search options/i })).toBeNull());

    // `useInfiniteOptions.onClose` empties the loaded pages; the id resolved while they were up
    // still names the closed trigger.
    expect(trigger(`${TRIGGER_NAME}, ${loaded[0].name}`)).toBeDefined();
  });

  it("keeps an infinite ids-in chip labelled after the close empties the list", async () => {
    const user = userEvent.setup();
    const loaded = options.slice(0, 3);
    const getValues = vi.fn().mockResolvedValue({ results: loaded, next_page_results: false });
    render(<InfiniteIdsIn getValues={getValues} chips />);

    await user.click(await popup().findByRole("option", { name: loaded[0].name }));
    await user.keyboard("{Escape}");

    // Without the resolution cache the chip falls back to rendering the raw id.
    await waitFor(() => expect(screen.getByLabelText(loaded[0].name)).toBeDefined());
    expect(screen.queryByLabelText(loaded[0].id)).toBeNull();
  });

  it("keeps a multi-select's query through a pick", async () => {
    const user = userEvent.setup();
    // Base UI empties the in-popup search field after every multi-select pick
    // (`input-clear`), which would otherwise read as the user clearing the query.
    const getValues = vi.fn(
      (_params: SelectPaginationParams): Promise<TPaginatedResponse<Option[]>> =>
        Promise.resolve({ results: options.slice(0, 5), next_page_results: false })
    );

    function MultiInfinite() {
      const [ids, setIds] = useState<string[]>([]);
      const props = {
        multiple: true,
        infinite: true,
        getValues,
        valueIds: ids,
        onChange: setIds,
        getOptionValue: (o: Option) => o.id,
        getOptionLabel: (o: Option) => o.name,
        placeholder: TRIGGER_NAME,
        searchPlaceholder: "Search options",
      } as unknown as ComponentProps<typeof Select<Option>>;
      return (
        <Select<Option> {...props}>
          <Select.Trigger<Option> variant="select-md">
            <Select.Value />
          </Select.Trigger>
        </Select>
      );
    }
    render(<MultiInfinite />);

    await openSelect(user);
    await user.type(search(), "Option 1");
    await waitFor(() => expect(getValues.mock.calls.some(([params]) => params.search === "Option 1")).toBe(true));
    const callsBeforePick = getValues.mock.calls.length;

    await user.click(await popup().findByRole("option", { name: "Option 1" }));

    expect(search()).toHaveProperty("value", "Option 1");
    // No reset fetch: an emptied field would refetch the unfiltered page 1.
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(getValues.mock.calls.length).toBe(callsBeforePick);
  });

  it("replaces the loaded list with the error row when a search fails", async () => {
    const user = userEvent.setup();
    const getValues = vi
      .fn()
      .mockResolvedValueOnce({ results: options.slice(0, 3), next_cursor: null, next_page_results: false })
      .mockRejectedValue(new Error("boom"));
    renderSelect({ infinite: true, getValues });

    await openSelect(user);
    await waitFor(() => expect(popup().getAllByRole("option")).toHaveLength(3));

    await user.type(search(), "abc");
    expect(await popup().findByRole("alert")).toBeDefined();
    // The rows the first page left behind are gone: a failed list is not a stale one.
    expect(popup().queryAllByRole("option")).toHaveLength(0);
  });

  it("keeps the loaded pages when appending the next one fails, and retries that page", async () => {
    const user = userEvent.setup();
    const getValues = vi
      .fn<(params: SelectPaginationParams) => Promise<TPaginatedResponse<Option[]>>>()
      .mockResolvedValueOnce({ results: options.slice(0, 3), next_cursor: "page-2", next_page_results: true })
      .mockRejectedValueOnce(new Error("boom"))
      .mockResolvedValueOnce({ results: options.slice(3, 6), next_page_results: false });
    // Multi-select so that picking a row does not close the popup out from under the assertions.
    const { onChange } = renderSelect({ infinite: true, getValues, multiple: true, value: [] });

    // The stubbed IntersectionObserver reports the paging sentinel visible as soon as it mounts, so
    // page 2 is requested — and rejected — the moment page 1 has rendered.
    await openSelect(user);
    expect(await popup().findByRole("alert")).toBeDefined();
    expect(getValues.mock.calls[1]?.[0]).toMatchObject({ cursor: "page-2" });

    // The three rows the user already had are still there, and still selectable.
    expect(popup().getAllByRole("option")).toHaveLength(3);
    await user.click(popup().getByRole("option", { name: "Option 1" }));
    expect(onChange).toHaveBeenCalledWith(["id-1"]);

    // Retry re-requests the page that failed rather than throwing the loaded pages away.
    await user.click(popup().getByRole("button", { name: /retry/i }));
    await waitFor(() => expect(getValues).toHaveBeenCalledTimes(3));
    expect(getValues.mock.calls[2]?.[0]).toMatchObject({ cursor: "page-2" });
    await waitFor(() => expect(popup().queryByRole("alert")).toBeNull());
    await waitFor(() => expect(popup().getAllByRole("option")).toHaveLength(6));
  });

  it("reports a base-ui open while `open` is controlled, and leaves a refused close alone", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    const onClose = vi.fn();
    const getValues = vi.fn().mockResolvedValue({ results: options.slice(0, 3), next_page_results: false });

    function Pinned() {
      const [open, setOpen] = useState(false);
      return (
        <Select<Option>
          multiple
          infinite
          getValues={getValues}
          open={open}
          onOpenChange={(next) => {
            onOpenChange(next);
            // The surface accepts opens and refuses closes — the "pinned open" filter row.
            if (next) setOpen(true);
          }}
          onClose={onClose}
          value={[]}
          onChange={vi.fn()}
          getOptionValue={(o) => o.id}
          getOptionLabel={(o) => o.name}
          placeholder={TRIGGER_NAME}
          searchPlaceholder="Search options"
        >
          <Select.Trigger variant="select-md">
            <Select.Value />
          </Select.Trigger>
        </Select>
      );
    }
    render(<Pinned />);

    await openSelect(user);
    // The trigger press is a base-ui-driven open, and it is reported like any other.
    expect(onOpenChange).toHaveBeenCalledWith(true);
    await waitFor(() => expect(popup().getAllByRole("option")).toHaveLength(3));
    expect(getValues).toHaveBeenCalledTimes(1);

    await user.keyboard("{Escape}");
    expect(onOpenChange).toHaveBeenCalledWith(false);
    // The caller kept it open, so nothing closed: no `onClose`, no cleared list, no second fetch.
    expect(onClose).not.toHaveBeenCalled();
    expect(popup().getAllByRole("option")).toHaveLength(3);
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(getValues).toHaveBeenCalledTimes(1);
  });

  it("ignores defaultOpen when open is controlled", async () => {
    render(
      <Select<Option>
        defaultOpen
        open={false}
        onOpenChange={vi.fn()}
        getValues={() => options}
        value={null}
        onChange={vi.fn()}
        getOptionValue={(o) => o.id}
        getOptionLabel={(o) => o.name}
        placeholder={TRIGGER_NAME}
        searchPlaceholder="Search options"
      >
        <Select.Trigger variant="select-md">
          <Select.Value />
        </Select.Trigger>
      </Select>
    );
    await waitFor(() => expect(popup().queryByRole("combobox", { name: /search options/i })).toBeNull());
  });

  it("sizes the panel from contentSizing", async () => {
    const user = userEvent.setup();
    renderSelect({ contentSizing: "anchor" });

    await openSelect(user);
    expect(document.querySelector("[data-select-popup]")?.className).toContain("min-w-(--anchor-width)");
  });

  it("defaults the panel to the content-hugging auto sizing", async () => {
    const user = userEvent.setup();
    renderSelect();

    await openSelect(user);
    expect(document.querySelector("[data-select-popup]")?.className).toContain("--popup-width-min");
  });

  it("puts the trigger id on the search-input variant's own field", () => {
    render(
      <Select<Option>
        multiple
        getValues={() => options.slice(0, 3)}
        value={[]}
        onChange={vi.fn()}
        getOptionValue={(o) => o.id}
        getOptionLabel={(o) => o.name}
        lazyMount={false}
        showSearch={false}
        placeholder={TRIGGER_NAME}
        searchPlaceholder="Add options"
      >
        <Select.Trigger variant="search-input" id="option-picker" data-tour="options" />
      </Select>
    );
    // The id has to name a labelable control, so it goes on the input rather than the chips frame;
    // `data-*` stay on the frame the tour points at.
    const field = screen.getByRole("combobox");
    expect(field.id).toBe("option-picker");
    expect(field.getAttribute("data-tour")).toBeNull();
    expect(document.querySelector("[data-tour='options']")).not.toBeNull();
  });

  it("drops the breadcrumb chevron for an explicit null appendIcon", () => {
    renderSelect({}, { variant: "breadcrumb", label: "Level 2", appendIcon: null });
    expect(screen.getByRole("button", { name: TRIGGER_NAME }).querySelectorAll("svg")).toHaveLength(0);
  });

  it("keeps the breadcrumb chevron when no appendIcon is given", () => {
    renderSelect({}, { variant: "breadcrumb", label: "Level 2" });
    expect(screen.getByRole("button", { name: TRIGGER_NAME }).querySelectorAll("svg").length).toBeGreaterThan(0);
  });

  it("draws a focus ring on the icon trigger, which has no chrome of its own", () => {
    renderSelect({}, { variant: "icon-sm", prependIcon: <span data-testid="glyph" /> });
    // `outline-none` kills the UA ring, so the keyboard indicator is the chrome's own.
    expect(trigger().className).toContain("focus-visible:ring-2");
  });

  it("forwards the trigger id and data attributes for the label to point at", async () => {
    const user = userEvent.setup();
    renderSelect({}, { id: "fruit-picker", "data-tour": "fruit", "data-testid": "fruit-trigger" });

    const resting = trigger();
    expect(resting.id).toBe("fruit-picker");
    expect(resting.getAttribute("data-tour")).toBe("fruit");
    expect(resting.getAttribute("data-testid")).toBe("fruit-trigger");

    await openSelect(user);
    const mounted = trigger();
    expect(mounted.id).toBe("fruit-picker");
    expect(mounted.getAttribute("data-tour")).toBe("fruit");
  });

  describe("standard option row", () => {
    it("marks a single selection with the trailing check only on the selected row", async () => {
      const user = userEvent.setup();
      renderSelect({ value: options[1] });

      await openSelect(user, `${TRIGGER_NAME}, Option 1`);
      const selected = await popup().findByRole("option", { name: "Option 1" });
      const other = popup().getByRole("option", { name: "Option 2" });

      expect(selected.getAttribute("aria-selected")).toBe("true");
      expect(other.getAttribute("aria-selected")).toBe("false");
      // The single-select mark sits after the label — the row's last child here, with no trailing.
      const indicator = selected.lastElementChild;
      expect(indicator?.hasAttribute("data-selected")).toBe(true);
      expect(other.lastElementChild?.hasAttribute("data-selected")).toBe(false);
      // No checkbox on a single-select row: just the label column and the check.
      expect(selected.children).toHaveLength(2);
      expect(selected.firstElementChild?.textContent).toBe("Option 1");
    });

    it("gives every multi-select row a leading checkbox, filled for the selection", async () => {
      const user = userEvent.setup();
      renderSelect({ multiple: true, value: [options[1]] });

      await openSelect(user, `${TRIGGER_NAME}, Option 1`);
      const selected = await popup().findByRole("option", { name: "Option 1" });
      const other = popup().getByRole("option", { name: "Option 2" });

      // The checkbox control is the row's first child, mounted on every row.
      expect(selected.firstElementChild?.firstElementChild?.hasAttribute("data-selected")).toBe(true);
      expect(other.firstElementChild?.firstElementChild).not.toBeNull();
      expect(other.firstElementChild?.firstElementChild?.hasAttribute("data-selected")).toBe(false);
    });

    it("renders the icon, trailing and description slots around the label", async () => {
      const user = userEvent.setup();
      renderSelect({
        getOptionIcon: (o: Option) => <span data-testid={`icon-${o.id}`} />,
        getOptionTrailing: (o: Option) => (o.id === "id-0" ? <span>trailing-0</span> : undefined),
        getOptionDescription: (o: Option) => (o.id === "id-0" ? "About option 0" : undefined),
      });

      await openSelect(user);
      const row = await popup().findByRole("option", { name: /Option 0/ });
      expect(within(row).getByTestId("icon-id-0")).toBeDefined();
      expect(within(row).getByText("trailing-0")).toBeDefined();
      expect(within(row).getByText("About option 0")).toBeDefined();
    });

    it("keeps an href row a single anchor option", async () => {
      const user = userEvent.setup();
      renderSelect({ getOptionHref: (o: Option) => (o.id === "id-0" ? "/somewhere" : undefined) });

      await openSelect(user);
      const row = await popup().findByRole("option", { name: "Option 0" });
      expect(row.tagName).toBe("A");
      expect(row.getAttribute("href")).toBe("/somewhere");
    });

    it("shows the selection's icon and label in Select.Value, without the list's mark", () => {
      renderSelect({ value: options[3], getOptionIcon: () => <span data-testid="value-icon" /> });

      const field = trigger(`${TRIGGER_NAME}, Option 3`);
      expect(within(field).getByTestId("value-icon")).toBeDefined();
      expect(within(field).getByText("Option 3")).toBeDefined();
      expect(field.querySelector("[data-selected]")).toBeNull();
    });

    it("still draws a deprecated renderOption row by hand, with no mark added", async () => {
      const user = userEvent.setup();
      renderSelect({ value: options[1], renderOption: (o: Option) => <span data-testid="legacy">{o.name}</span> });

      await openSelect(user, `${TRIGGER_NAME}, Option 1`);
      const selected = await popup().findByRole("option", { name: "Option 1" });
      expect(within(selected).getByTestId("legacy")).toBeDefined();
      expect(selected.children).toHaveLength(1);
    });
  });
});
