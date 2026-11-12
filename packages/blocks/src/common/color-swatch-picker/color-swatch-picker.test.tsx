/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ColorSwatchPicker } from "./color-swatch-picker";

const hexField = () => screen.getByRole<HTMLInputElement>("textbox", { name: "Hex color" });

/** Every call site is controlled: it stores what `onChange` emits and feeds it straight back as `value`. */
function ControlledPicker(props: { initial?: string; onChange: (hex: string) => void }) {
  const [value, setValue] = useState(props.initial ?? "");
  return (
    <ColorSwatchPicker
      value={value}
      onChange={(hex) => {
        setValue(hex);
        props.onChange(hex);
      }}
    />
  );
}

describe("ColorSwatchPicker", () => {
  it("fires onChange with the swatch's hex and marks the current one pressed", async () => {
    const onChange = vi.fn();
    render(<ColorSwatchPicker value="#FF6900" colors={["#FF6900", "#0693E3"]} onChange={onChange} />);
    expect(screen.getByRole("group", { name: "Preset colors" }).children).toHaveLength(2);
    expect(screen.getByRole("button", { name: "#ff6900" }).getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByRole("button", { name: "#0693e3" }).getAttribute("aria-pressed")).toBe("false");
    await userEvent.click(screen.getByRole("button", { name: "#0693e3" }));
    expect(onChange).toHaveBeenCalledWith("#0693e3");
  });

  it("commits a typed hex at three characters and again at six", async () => {
    const onChange = vi.fn();
    render(<ColorSwatchPicker value="" onChange={onChange} />);
    await userEvent.type(hexField(), "12");
    expect(onChange).not.toHaveBeenCalled();
    // three digits is a colour, and the picker this replaces committed it expanded
    await userEvent.type(hexField(), "a");
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenLastCalledWith("#1122aa");
    // four is not
    await userEvent.type(hexField(), "b");
    expect(onChange).toHaveBeenCalledTimes(1);
    await userEvent.type(hexField(), "EF");
    expect(onChange).toHaveBeenCalledTimes(2);
    expect(onChange).toHaveBeenLastCalledWith("#12abef");
  });

  it("commits a pasted #rrggbb whole", async () => {
    const onChange = vi.fn();
    render(<ControlledPicker onChange={onChange} />);
    await userEvent.click(hexField());
    await userEvent.paste("#0693e3");
    expect(onChange).toHaveBeenCalledWith("#0693e3");
    expect(hexField().value).toBe("0693e3");
  });

  it("expands a three-digit draft on blur instead of discarding it", async () => {
    const onChange = vi.fn();
    render(<ControlledPicker onChange={onChange} />);
    await userEvent.type(hexField(), "fff");
    expect(onChange).toHaveBeenLastCalledWith("#ffffff");
    await userEvent.tab();
    expect(hexField().value).toBe("ffffff");
  });

  it("leaves the draft alone while the field has focus", async () => {
    const onChange = vi.fn();
    render(<ControlledPicker onChange={onChange} />);
    await userEvent.type(hexField(), "ABCDEF");
    expect(onChange).toHaveBeenLastCalledWith("#abcdef");
    // the echoed value must not rewrite the casing under the caret; blur canonicalises it
    expect(hexField().value).toBe("ABCDEF");
    await userEvent.tab();
    expect(hexField().value).toBe("abcdef");
  });

  it("drops a leading # and snaps an incomplete draft back to the value on blur", async () => {
    const onChange = vi.fn();
    render(<ColorSwatchPicker value="#0693e3" onChange={onChange} />);
    expect(hexField().value).toBe("0693e3");
    await userEvent.clear(hexField());
    await userEvent.type(hexField(), "#ab");
    expect(hexField().value).toBe("ab");
    await userEvent.tab();
    expect(hexField().value).toBe("0693e3");
    expect(onChange).not.toHaveBeenCalled();
  });

  it("renders the ten default swatches when no palette is given", () => {
    render(<ColorSwatchPicker onChange={() => {}} />);
    expect(screen.getByRole("group", { name: "Preset colors" }).children).toHaveLength(10);
  });
});
