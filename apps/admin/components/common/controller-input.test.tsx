/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm } from "react-hook-form";
import { describe, expect, it } from "vitest";
import { ControllerInput } from "./controller-input";

function CredentialsForm() {
  const { control, formState } = useForm({ defaultValues: { secret: "" }, mode: "onBlur" });

  return (
    <form>
      <ControllerInput
        control={control}
        name="secret"
        type="password"
        label="API key"
        description="Keep this key private."
        placeholder="Enter API key"
        required
        error={Boolean(formState.errors.secret)}
      />
      <output aria-label="Touched">{String(Boolean(formState.touchedFields.secret))}</output>
    </form>
  );
}

describe("ControllerInput", () => {
  it("associates the field hint and reports required validation after blur", async () => {
    const user = userEvent.setup();
    render(<CredentialsForm />);
    const input = screen.getByLabelText(/API key/) as HTMLInputElement;

    expect(input.getAttribute("aria-required")).toBe("true");
    const describedBy = input.getAttribute("aria-describedby");
    expect(describedBy).toBeTruthy();
    expect(document.getElementById(describedBy!.split(" ")[0])?.textContent).toBe("Keep this key private.");

    await user.click(input);
    await user.tab();

    expect(screen.getByRole("status", { name: "Touched" }).textContent).toBe("true");
    expect(await screen.findByText("API key is required.")).toBeTruthy();
    expect(input.getAttribute("aria-invalid")).toBe("true");
  });

  it("keeps password reveal in the keyboard order and preserves the form value", async () => {
    const user = userEvent.setup();
    render(<CredentialsForm />);
    const input = screen.getByLabelText(/API key/) as HTMLInputElement;
    await user.click(input);
    await user.type(input, "safe-test-value");
    await user.tab();

    const toggle = screen.getByRole("button", { name: "Show password" });
    expect(document.activeElement).toBe(toggle);
    await user.keyboard("{Enter}");
    expect(input.type).toBe("text");
    expect(input.value).toBe("safe-test-value");
    expect(screen.getByRole("button", { name: "Hide password" }).getAttribute("aria-pressed")).toBe("true");

    await user.keyboard(" ");
    expect(input.type).toBe("password");
    expect(input.value).toBe("safe-test-value");
  });
});
