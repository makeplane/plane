/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FilterInstance, workItemFiltersAdapter } from "@plane/shared-state";
import type { TWorkItemFilterExpression } from "@plane/types";
import { CORE_TEXT_OPERATOR } from "@plane/types";
import { TextFilterValueInput } from "./text";

afterEach(cleanup);

describe("text filter editing", () => {
  it("keeps typing local and commits a trimmed substring on Enter", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<TextFilterValueInput value="" placeholder="Enter title" onChange={onChange} />);
    const input = screen.getByRole("textbox", { name: "Filter value" });
    await user.type(input, "  Login, SSO  ");
    expect(onChange).not.toHaveBeenCalled();
    await user.keyboard("{Enter}");
    expect(onChange).toHaveBeenCalledExactlyOnceWith("Login, SSO");
  });
  it("commits an edited value on blur without issuing requests while typing", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<TextFilterValueInput value="login" placeholder="Enter title" onChange={onChange} />);
    await user.clear(screen.getByRole("textbox"));
    await user.type(screen.getByRole("textbox"), "  payment  ");
    expect(onChange).not.toHaveBeenCalled();
    await user.tab();
    expect(onChange).toHaveBeenCalledExactlyOnceWith("payment");
  });

  it("discards the draft on Escape, including after blur", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<TextFilterValueInput value="login" placeholder="Enter title" onChange={onChange} />);
    await user.clear(screen.getByRole("textbox"));
    await user.type(screen.getByRole("textbox"), "payment{Escape}");
    expect((screen.getByRole("textbox") as HTMLInputElement).value).toBe("login");
    await user.tab();
    expect(onChange).not.toHaveBeenCalled();
  });

  it("commits the empty-value sentinel only after editing finishes", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<TextFilterValueInput value="login" placeholder="Enter title" onChange={onChange} />);
    await user.clear(screen.getByRole("textbox"));
    await user.type(screen.getByRole("textbox"), "   ");
    expect(onChange).not.toHaveBeenCalled();
    await user.keyboard("{Enter}");
    expect(onChange).toHaveBeenCalledExactlyOnceWith(null);
  });

  it("replaces an uncommitted draft when a saved expression is restored", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { rerender } = render(<TextFilterValueInput value="login" placeholder="Enter title" onChange={onChange} />);
    await user.type(screen.getByRole("textbox"), " draft");
    rerender(<TextFilterValueInput value="payment" placeholder="Enter title" onChange={onChange} />);
    expect((screen.getByRole("textbox") as HTMLInputElement).value).toBe("payment");
    expect(onChange).not.toHaveBeenCalled();
  });

  it("does not edit or commit a disabled filter", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<TextFilterValueInput value="login" placeholder="Enter title" isDisabled onChange={onChange} />);
    await user.type(screen.getByRole("textbox"), "payment{Enter}");
    expect((screen.getByRole("textbox") as HTMLInputElement).value).toBe("login");
    expect(onChange).not.toHaveBeenCalled();
  });

  it("removes a cleared title from the persisted expression while preserving priority", async () => {
    const user = userEvent.setup();
    const persisted: TWorkItemFilterExpression[] = [];
    const filter = new FilterInstance({
      adapter: workItemFiltersAdapter,
      initialExpression: { and: [{ name__icontains: "login" }, { priority__in: "high" }] },
      onExpressionChange: (expression) => persisted.push(expression),
    });
    const title = filter.findFirstConditionByPropertyAndOperator("name", CORE_TEXT_OPERATOR.ICONTAINS)!;
    render(
      <TextFilterValueInput
        value="login"
        placeholder="Enter title"
        onChange={(value) => filter.updateConditionValue(title.id, value)}
      />
    );
    await user.clear(screen.getByRole("textbox"));
    await user.keyboard("{Enter}");
    expect(persisted).toEqual([{ priority__in: "high" }]);
    expect(filter.findFirstConditionByPropertyAndOperator("name", CORE_TEXT_OPERATOR.ICONTAINS)).toBeUndefined();
  });
});
