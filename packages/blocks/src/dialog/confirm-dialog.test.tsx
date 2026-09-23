/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ConfirmDialog } from "./confirm-dialog";
import type { ConfirmDialogProps } from "./confirm-dialog";

function renderDialog(overrides: Partial<ConfirmDialogProps> = {}) {
  const handleClose = vi.fn();
  const handleSubmit = vi.fn();
  const props = {
    isOpen: true,
    isSubmitting: false,
    title: "Delete cycle",
    content: "This cycle and its links will be deleted.",
    handleClose,
    handleSubmit,
    ...overrides,
  } as ConfirmDialogProps;
  const view = render(<ConfirmDialog {...props} />);
  return { ...view, props, handleClose: props.handleClose, handleSubmit: props.handleSubmit };
}

/** The confirm button, once the async i18n catalog has named it. */
const confirmButton = (name: string | RegExp = "Delete") => screen.findByRole("button", { name });
const cancelButton = (name: string | RegExp = "Cancel") => screen.findByRole("button", { name });

/** The intent badge is the header's leading, decorative element; the title column follows it. */
function getBadge(dialog: HTMLElement): Element | null {
  const header = screen.getByRole("heading", { name: "Delete cycle" }).parentElement?.parentElement;
  const first = header?.firstElementChild ?? null;
  return first?.getAttribute("aria-hidden") === "true" && dialog.contains(first) ? first : null;
}

describe("ConfirmDialog open state", () => {
  it("renders nothing while closed", () => {
    renderDialog({ isOpen: false });
    expect(screen.queryByRole("alertdialog")).toBeNull();
  });

  it("renders an alert dialog named by its title and described by its content", async () => {
    renderDialog({
      content: (
        <>
          Delete <strong>Sprint 4</strong>?
        </>
      ),
    });
    const dialog = await screen.findByRole("alertdialog", { name: "Delete cycle" });
    const description = document.getElementById(dialog.getAttribute("aria-describedby") ?? "");
    expect(description?.textContent).toBe("Delete Sprint 4?");
    expect(dialog.hasAttribute("data-prevent-outside-click")).toBe(true);
  });

  it("opens and closes with isOpen", async () => {
    const { rerender, props } = renderDialog({ isOpen: false });
    rerender(<ConfirmDialog {...props} isOpen />);
    expect(await screen.findByRole("alertdialog")).toBeDefined();
    rerender(<ConfirmDialog {...props} isOpen={false} />);
    await waitFor(() => expect(screen.queryByRole("alertdialog")).toBeNull());
    expect(props.handleClose).not.toHaveBeenCalled();
  });
});

describe("ConfirmDialog labels", () => {
  it("defaults the buttons to the translated delete and cancel labels", async () => {
    renderDialog();
    expect(await confirmButton("Delete")).toBeDefined();
    expect(await cancelButton("Cancel")).toBeDefined();
  });

  it("defaults the in-flight label to the translated deleting label", async () => {
    renderDialog({ isSubmitting: true });
    expect(await confirmButton("Deleting")).toBeDefined();
  });

  it("takes caller copy for both buttons and both confirm states", async () => {
    const primaryButtonText = { default: "Archive", loading: "Archiving" };
    const { rerender, props } = renderDialog({ primaryButtonText, secondaryButtonText: "Keep it" });
    expect(await confirmButton("Archive")).toBeDefined();
    expect(await cancelButton("Keep it")).toBeDefined();
    rerender(<ConfirmDialog {...props} isSubmitting primaryButtonText={primaryButtonText} />);
    expect(await confirmButton("Archiving")).toBeDefined();
  });

  it("keeps the idle label in flight when no loading label is given", async () => {
    // The props type only lets a literal `isSubmitting={false}` omit `loading`; the runtime still
    // falls back to the idle label rather than rendering an empty button.
    renderDialog({ isSubmitting: true, primaryButtonText: { default: "Move" } } as Partial<ConfirmDialogProps>);
    const confirm = await confirmButton("Move");
    expect(confirm.getAttribute("aria-busy")).toBe("true");
  });
});

describe("ConfirmDialog actions", () => {
  it("calls handleSubmit, and only handleSubmit, on confirm", async () => {
    const user = userEvent.setup();
    const { handleSubmit, handleClose } = renderDialog();
    await user.click(await confirmButton());
    expect(handleSubmit).toHaveBeenCalledTimes(1);
    expect(handleClose).not.toHaveBeenCalled();
  });

  it("calls handleClose, and only handleClose, on cancel", async () => {
    const user = userEvent.setup();
    const { handleSubmit, handleClose } = renderDialog();
    await user.click(await cancelButton());
    await waitFor(() => expect(handleClose).toHaveBeenCalledTimes(1));
    expect(handleSubmit).not.toHaveBeenCalled();
  });

  it("calls handleClose on Escape", async () => {
    const user = userEvent.setup();
    const { handleSubmit, handleClose } = renderDialog();
    await screen.findByRole("alertdialog");
    await user.keyboard("{Escape}");
    await waitFor(() => expect(handleClose).toHaveBeenCalledTimes(1));
    expect(handleSubmit).not.toHaveBeenCalled();
  });

  it("does not close on an outside press", async () => {
    const user = userEvent.setup();
    const { handleClose } = renderDialog();
    await screen.findByRole("alertdialog");
    await user.click(document.body);
    expect(handleClose).not.toHaveBeenCalled();
    expect(screen.getByRole("alertdialog")).toBeDefined();
  });

  it("hard-disables the confirm button with isDisabled but still lets the user cancel", async () => {
    const user = userEvent.setup();
    const { handleSubmit, handleClose } = renderDialog({ isDisabled: true });
    const confirm = await confirmButton();
    expect(confirm.hasAttribute("disabled")).toBe(true);
    await user.click(confirm);
    expect(handleSubmit).not.toHaveBeenCalled();
    await user.click(await cancelButton());
    await waitFor(() => expect(handleClose).toHaveBeenCalledTimes(1));
  });
});

describe("ConfirmDialog while submitting", () => {
  it("vetoes Escape", async () => {
    const user = userEvent.setup();
    const { handleClose } = renderDialog({ isSubmitting: true });
    await screen.findByRole("alertdialog");
    await user.keyboard("{Escape}");
    expect(handleClose).not.toHaveBeenCalled();
    expect(screen.getByRole("alertdialog").hasAttribute("data-open")).toBe(true);
  });

  it("disables cancel and marks the confirm button busy", async () => {
    const user = userEvent.setup();
    const { handleClose, handleSubmit } = renderDialog({ isSubmitting: true });
    const cancel = await cancelButton();
    expect(cancel.hasAttribute("disabled")).toBe(true);
    await user.click(cancel);
    expect(handleClose).not.toHaveBeenCalled();

    const confirm = await confirmButton("Deleting");
    expect(confirm.getAttribute("aria-busy")).toBe("true");
    await user.click(confirm);
    expect(handleSubmit).not.toHaveBeenCalled();
  });

  it("closes again on Escape once the submit settles", async () => {
    const user = userEvent.setup();
    const { rerender, props } = renderDialog({ isSubmitting: true });
    await screen.findByRole("alertdialog");
    rerender(<ConfirmDialog {...props} isSubmitting={false} />);
    await user.keyboard("{Escape}");
    await waitFor(() => expect(props.handleClose).toHaveBeenCalledTimes(1));
  });
});

describe("ConfirmDialog variants", () => {
  it.each([
    { variant: undefined, button: "danger", tint: "text-icon-danger-secondary" },
    { variant: "danger", button: "danger", tint: "text-icon-danger-secondary" },
    { variant: "primary", button: "primary", tint: "text-icon-info-secondary" },
    { variant: "warning", button: "primary", tint: "text-icon-warning-secondary" },
  ] as const)("maps $variant to a $button confirm button and its badge", async ({ variant, button, tint }) => {
    renderDialog({ variant });
    const confirm = await confirmButton();
    expect(confirm.getAttribute("data-variant")).toBe(button);
    expect((await cancelButton()).getAttribute("data-variant")).toBe("secondary");
    const badge = getBadge(screen.getByRole("alertdialog"));
    expect(badge?.classList.contains(tint)).toBe(true);
  });

  it("drops the badge with hideIcon", async () => {
    renderDialog({ hideIcon: true });
    expect(getBadge(await screen.findByRole("alertdialog"))).toBeNull();
  });

  it("puts a custom glyph inside the variant-tinted badge", async () => {
    renderDialog({ variant: "primary", customIcon: <svg data-testid="custom-glyph" /> });
    const badge = getBadge(await screen.findByRole("alertdialog"));
    expect(badge?.contains(screen.getByTestId("custom-glyph"))).toBe(true);
    expect(badge?.classList.contains("text-icon-info-secondary")).toBe(true);
  });
});
