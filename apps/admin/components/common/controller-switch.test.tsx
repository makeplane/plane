/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm } from "react-hook-form";
import { describe, expect, it } from "vitest";
import { ControllerSwitch } from "./controller-switch";

function SyncForm({ initialValue }: { initialValue: string }) {
  const { control, watch, formState } = useForm({ defaultValues: { sync: initialValue } });

  return (
    <>
      <ControllerSwitch control={control} field={{ name: "sync", label: "Google" }} />
      <output aria-label="Sync value">{watch("sync")}</output>
      <output aria-label="Touched">{String(Boolean(formState.touchedFields.sync))}</output>
    </>
  );
}

describe("ControllerSwitch", () => {
  it.each(["0", "invalid"])("preserves the configuration API's string values from %s", async (initialValue) => {
    const user = userEvent.setup();
    render(<SyncForm initialValue={initialValue} />);
    const toggle = screen.getByRole("switch", { name: "Refresh user attributes from Google during sign in" });
    expect(toggle.getAttribute("aria-checked")).toBe("false");

    await user.tab();
    expect(document.activeElement).toBe(toggle);
    await user.keyboard(" ");
    expect(toggle.getAttribute("aria-checked")).toBe("true");
    expect(screen.getByRole("status", { name: "Sync value" }).textContent).toBe("1");

    await user.keyboard(" ");
    expect(toggle.getAttribute("aria-checked")).toBe("false");
    expect(screen.getByRole("status", { name: "Sync value" }).textContent).toBe("0");
    await user.tab();
    expect(screen.getByRole("status", { name: "Touched" }).textContent).toBe("true");
  });

  it("retains an enabled initial configuration", () => {
    render(<SyncForm initialValue="1" />);
    expect(screen.getByRole("switch").getAttribute("aria-checked")).toBe("true");
  });
});
