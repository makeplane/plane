/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { TypeToConfirmDialog } from "./type-to-confirm-dialog";
import type { TypeToConfirmDialogProps } from "./type-to-confirm-dialog";

function renderDialog(overrides: Partial<TypeToConfirmDialogProps> = {}) {
  const props: TypeToConfirmDialogProps = {
    isOpen: true,
    onClose: vi.fn(),
    onConfirm: vi.fn(),
    title: "Delete project",
    description: "All of the project's data will be removed.",
    fields: [{ name: "projectName", label: "Project name", expectedValue: "Apollo" }],
    confirmLabel: "Delete project",
    loadingLabel: "Deleting",
    ...overrides,
  };
  const view = render(<TypeToConfirmDialog {...props} />);
  return { ...view, props };
}

/** A promise the test settles by hand, to hold the dialog in its in-flight state. */
function createDeferred() {
  const deferred: { promise: Promise<void>; resolve: () => void } = { promise: Promise.resolve(), resolve: () => {} };
  deferred.promise = new Promise<void>((resolve) => {
    deferred.resolve = resolve;
  });
  return deferred;
}

const confirmButton = () => screen.findByRole("button", { name: "Delete project" });

describe("TypeToConfirmDialog", () => {
  it("renders a danger alert dialog named by its title with a labelled input", async () => {
    renderDialog();
    const dialog = await screen.findByRole("alertdialog", { name: "Delete project" });
    expect(dialog.hasAttribute("data-prevent-outside-click")).toBe(true);
    const input = screen.getByRole("textbox", { name: /Project name/ });
    expect(input.getAttribute("placeholder")).toBe("Apollo");
  });

  it("keeps confirm disabled until the typed value matches", async () => {
    const { props } = renderDialog();
    const button = await confirmButton();
    expect(button.hasAttribute("disabled") || button.getAttribute("aria-disabled") === "true").toBe(true);

    const user = userEvent.setup();
    await user.type(screen.getByRole("textbox", { name: /Project name/ }), "Apoll");
    await user.click(button);
    expect(props.onConfirm).not.toHaveBeenCalled();

    await user.type(screen.getByRole("textbox", { name: /Project name/ }), "o ");
    await user.click(await confirmButton());
    expect(props.onConfirm).toHaveBeenCalledTimes(1);
  });

  it("requires every field to match", async () => {
    const { props } = renderDialog({
      fields: [
        { name: "projectName", label: "Project name", expectedValue: "Apollo" },
        { name: "confirmDelete", label: "Confirmation phrase", expectedValue: "delete my project" },
      ],
    });
    const user = userEvent.setup();
    await user.type(await screen.findByRole("textbox", { name: /Project name/ }), "Apollo{Enter}");
    expect(props.onConfirm).not.toHaveBeenCalled();

    await user.type(screen.getByRole("textbox", { name: /Confirmation phrase/ }), "delete my project{Enter}");
    await waitFor(() => expect(props.onConfirm).toHaveBeenCalledTimes(1));
  });

  it("clears what was typed when it opens again", async () => {
    const { props, rerender } = renderDialog();
    const user = userEvent.setup();
    await user.type(await screen.findByRole("textbox", { name: /Project name/ }), "Apollo");
    rerender(<TypeToConfirmDialog {...props} isOpen={false} />);
    await waitFor(() => expect(screen.queryByRole("alertdialog")).toBeNull());
    rerender(<TypeToConfirmDialog {...props} isOpen />);
    const input = (await screen.findByRole("textbox", { name: /Project name/ })) as HTMLInputElement;
    expect(input.value).toBe("");
  });

  it("closes through cancel and ignores close requests while confirming", async () => {
    const pending = createDeferred();
    const onConfirm = vi.fn(() => pending.promise);
    const { props } = renderDialog({ onConfirm });
    const user = userEvent.setup();
    await user.click(await screen.findByRole("button", { name: "Cancel" }));
    expect(props.onClose).toHaveBeenCalledTimes(1);

    await user.type(screen.getByRole("textbox", { name: /Project name/ }), "Apollo");
    await user.click(await confirmButton());
    expect(await screen.findByRole("button", { name: "Deleting" })).toBeDefined();
    await user.keyboard("{Escape}");
    expect(props.onClose).toHaveBeenCalledTimes(1);
    pending.resolve();
    expect(await confirmButton()).toBeDefined();
  });
});
