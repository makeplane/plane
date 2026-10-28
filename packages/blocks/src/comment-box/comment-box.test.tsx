/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CommentBox } from "./comment-box";

describe("CommentBox", () => {
  it("renders the editor and toolbar slots and submits when allowed", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <CommentBox
        editor={<div data-testid="editor" />}
        toolbar={<div role="toolbar" aria-label="Formatting" />}
        submitLabel="Comment"
        onSubmit={onSubmit}
        canSubmit
      />
    );

    expect(screen.getByTestId("editor")).toBeTruthy();
    expect(screen.getByRole("toolbar", { name: "Formatting" })).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Comment" }));
    expect(onSubmit).toHaveBeenCalledOnce();
  });

  it("keeps the submit button disabled while content cannot be submitted", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<CommentBox editor={null} submitLabel="Comment" onSubmit={onSubmit} canSubmit={false} />);

    const button = screen.getByRole("button", { name: "Comment" });
    expect(button.hasAttribute("disabled")).toBe(true);
    await user.click(button);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("does not submit an enclosing form", async () => {
    const user = userEvent.setup();
    const onFormSubmit = vi.fn((event: Event) => event.preventDefault());
    const onSubmit = vi.fn();
    render(
      <form onSubmit={(event) => onFormSubmit(event.nativeEvent)}>
        <CommentBox editor={null} submitLabel="Comment" onSubmit={onSubmit} canSubmit />
      </form>
    );

    await user.click(screen.getByRole("button", { name: "Comment" }));
    expect(onSubmit).toHaveBeenCalledOnce();
    expect(onFormSubmit).not.toHaveBeenCalled();
  });
});
