/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useRef } from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useOutsideClickDetector } from "@plane/hooks";
import { ContextMenu } from "../context-menu/context-menu";
import { DateSelect } from "./date-select";

const JUNE_2025 = new Date(2025, 5, 1);

/**
 * A panel (peek, sidebar, modal body) that closes on an outside press, holding blocks popups the
 * way the app's panels do. Every popup is portaled to `<body>`, so the press path never includes
 * the panel — the detector has to recognise the Base UI portal instead.
 */
function Panel({ onOutsideClick }: { onOutsideClick: () => void }) {
  const panelRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  useOutsideClickDetector(panelRef, onOutsideClick);
  return (
    <>
      <div ref={panelRef} data-testid="panel">
        <DateSelect
          value={null}
          onChange={vi.fn()}
          variant="select-md"
          placeholder="Set date"
          defaultMonth={JUNE_2025}
          defaultOpen
        />
        <div ref={cardRef} data-testid="card">
          Card
        </div>
        <ContextMenu parentRef={cardRef} items={[{ key: "edit", title: "Edit", action: vi.fn() }]} />
      </div>
      <div data-testid="outside">Somewhere else</div>
    </>
  );
}

describe("portalled blocks popups inside an outside-click panel", () => {
  it("does not treat a press inside the date calendar as outside the panel", () => {
    const onOutsideClick = vi.fn();
    render(<Panel onOutsideClick={onOutsideClick} />);

    const dayButton = within(document.body).getByRole("button", { name: /June 15th, 2025/ });
    expect(screen.getByTestId("panel").contains(dayButton)).toBe(false);
    expect(dayButton.closest("[data-base-ui-portal]")).not.toBeNull();
    fireEvent.mouseDown(dayButton);

    expect(onOutsideClick).not.toHaveBeenCalled();
  });

  it("does not treat a press inside the context menu as outside the panel", async () => {
    const onOutsideClick = vi.fn();
    render(<Panel onOutsideClick={onOutsideClick} />);

    fireEvent.contextMenu(screen.getByTestId("card"), { clientX: 40, clientY: 40 });
    const item = await screen.findByRole("menuitem", { name: "Edit" });
    expect(screen.getByTestId("panel").contains(item)).toBe(false);
    fireEvent.mouseDown(item);

    expect(onOutsideClick).not.toHaveBeenCalled();
  });

  it("still reports a press outside the panel and its popups", () => {
    const onOutsideClick = vi.fn();
    render(<Panel onOutsideClick={onOutsideClick} />);

    fireEvent.mouseDown(screen.getByTestId("outside"));

    expect(onOutsideClick).toHaveBeenCalledTimes(1);
  });
});
