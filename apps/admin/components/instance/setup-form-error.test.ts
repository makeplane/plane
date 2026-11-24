/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { describe, expect, it } from "vitest";
import { getSetupFormError } from "./setup-form-error";

describe("getSetupFormError", () => {
  it("returns no error when there is no error code", () => {
    expect(getSetupFormError(undefined)).toEqual({ field: undefined, message: undefined });
  });

  it("shows an invalid admin email (5160) on the email field", () => {
    expect(getSetupFormError("5160")).toEqual({ field: "email", message: "Please enter a valid email address." });
  });

  it("shows a too-weak password (5021) on the password field", () => {
    expect(getSetupFormError("5021").field).toBe("password");
  });

  it("shows instance not configured (5000) in the banner", () => {
    expect(getSetupFormError("5000")).toEqual({
      field: "banner",
      message: "Instance is not configured. Please contact your administrator.",
    });
  });

  it.each([
    ["5150", "Admin already exists. Please try again."],
    ["5155", "Email, password and first name required. Please try again."],
  ])("shows admin error %s in the banner with its message", (code, message) => {
    expect(getSetupFormError(code)).toEqual({ field: "banner", message });
  });

  it("shows admin user already exists (5180) in the banner with a sign-in link", () => {
    const error = getSetupFormError("5180");
    expect(error.field).toBe("banner");
    expect(error.message).toBeTruthy();
  });

  it.each(["9999", "INVALID_ADMIN_EMAIL"])("falls back to a generic banner for unknown code %j", (code) => {
    expect(getSetupFormError(code)).toEqual({ field: "banner", message: "Something went wrong. Please try again." });
  });
});
