import { render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import { CustomSearchSelect } from "@/dropdowns/custom-search-select";

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
