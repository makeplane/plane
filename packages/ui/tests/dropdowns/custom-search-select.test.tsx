import { render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import { CustomSearchSelect, mirrorCallerShapeOnSingleChange } from "@/dropdowns/custom-search-select";

vi.mock("@plane/hooks", () => ({ useOutsideClickDetector: () => {} }));

const options = [
  { value: "a", query: "Alpha", content: <span>Alpha</span> },
  { value: "b", query: "Beta", content: <span>Beta</span> },
];

// Note: when the Combobox is closed, HeadlessUI renders the trigger as a
// <button aria-haspopup="listbox"> rather than as a combobox role (the
// combobox role is on Combobox.Input, which only mounts when open).
// We assert on the trigger button — the element that actually shows the
// selected content.
const getTrigger = () => screen.getByRole("button");

describe("CustomSearchSelect — selectedContent opt-in", () => {
  test("renders label when no value selected", () => {
    render(<CustomSearchSelect label="Pick one" value={[]} options={options} onChange={() => {}} />);
    expect(getTrigger()).toHaveTextContent("Pick one");
  });

  test("renders label when value is empty (zero-length)", () => {
    render(
      <CustomSearchSelect
        label="Pick one"
        value={[]}
        options={options}
        onChange={() => {}}
        selectedContent={() => null}
      />
    );
    expect(getTrigger()).toHaveTextContent("Pick one");
  });

  test("renders selectedContent when one value selected", () => {
    render(
      <CustomSearchSelect
        label="Pick one"
        value={["a"]}
        options={options}
        onChange={() => {}}
        selectedContent={(v: string) => <span>Selected {v}</span>}
      />
    );
    expect(getTrigger()).toHaveTextContent("Selected a");
    expect(getTrigger()).not.toHaveTextContent("Pick one");
  });

  test("renders multipleLabel when multi", () => {
    render(
      <CustomSearchSelect
        label="Pick many"
        value={["a", "b"]}
        options={options}
        onChange={() => {}}
        multiple
        multipleLabel={(count: number) => `${count} chosen`}
      />
    );
    expect(getTrigger()).toHaveTextContent("2 chosen");
  });

  test("backwards compatible — omitting new prop falls back to label-only", () => {
    render(<CustomSearchSelect label="Pick one" value={["a"]} options={options} onChange={() => {}} />);
    expect(getTrigger()).toHaveTextContent("Pick one");
  });

  test("§bug-class — single-select with array value still triggers label update", () => {
    // Dashboard passes array values to single-select filters (e.g. `["this_quarter"]`).
    // The component must still surface the chosen option label, not the raw label,
    // even though Headless UI's internal single-select contract uses scalars.
    const { rerender } = render(
      <CustomSearchSelect
        label="Pick one"
        value={["a"]}
        options={options}
        onChange={() => {}}
        selectedContent={(v: string) => <span>Selected {v}</span>}
      />
    );
    expect(getTrigger()).toHaveTextContent("Selected a");
    rerender(
      <CustomSearchSelect
        label="Pick one"
        value={["b"]}
        options={options}
        onChange={() => {}}
        selectedContent={(v: string) => <span>Selected {v}</span>}
      />
    );
    expect(getTrigger()).toHaveTextContent("Selected b");
  });
});

// ---------------------------------------------------------------------------
// §bug-class — single-select onChange must mirror the caller's input shape.
//
// The project-invite modal passes `value` as a scalar and expects `onChange`
// to fire with a scalar. The dashboard's single-select filters pass `value`
// as a one-element array and expect `onChange` to fire with an array. The
// component must preserve the caller's input shape on output so both
// contract holders keep working — wrapping everything in an array broke
// downstream code that uses the chosen value as a dict key (which is what
// caused the `unhashable type: 'list'` 500 on POST /project-members/).
//
// These tests exercise the real exported helper that the component uses
// internally, so a regression in the shape-mirroring logic in
// `custom-search-select.tsx` will fail here.
// ---------------------------------------------------------------------------
describe("mirrorCallerShapeOnSingleChange", () => {
  test("scalar-in → scalar-out (project-invite modal pattern)", () => {
    const seen: unknown[] = [];
    const handler = mirrorCallerShapeOnSingleChange("a", (v) => seen.push(v));
    handler("a");
    expect(seen).toEqual(["a"]);
    handler("b");
    expect(seen).toEqual(["a", "b"]);
  });

  test("array-in → array-out (dashboard single-select pattern)", () => {
    const seen: unknown[] = [];
    const handler = mirrorCallerShapeOnSingleChange(["a"], (v) => seen.push(v));
    handler("b");
    expect(seen).toEqual([["b"]]);
  });

  test("scalar-in cleared → undefined-out (Headless UI emits undefined)", () => {
    const seen: unknown[] = [];
    const handler = mirrorCallerShapeOnSingleChange("a", (v) => seen.push(v));
    handler(undefined);
    expect(seen).toEqual([undefined]);
  });

  test("array-in cleared → empty-array-out (Headless UI emits null)", () => {
    const seen: unknown[] = [];
    const handler = mirrorCallerShapeOnSingleChange(["a"], (v) => seen.push(v));
    handler(null);
    expect(seen).toEqual([[]]);
  });

  test("undefined-in → whatever-passes-through", () => {
    // Initial render before the parent hydrates the value: we still pass
    // through Headless UI's payload verbatim. This is the same behavior as
    // the scalar branch and matches the contract documented on the helper.
    const seen: unknown[] = [];
    const handler = mirrorCallerShapeOnSingleChange(undefined, (v) => seen.push(v));
    handler("a");
    expect(seen).toEqual(["a"]);
  });
});