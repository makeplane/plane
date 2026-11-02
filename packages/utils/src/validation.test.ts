/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { describe, expect, it } from "vitest";
import { validatePersonName } from "./validation";

describe("validatePersonName", () => {
  it.each([
    "John",
    "Jean-Paul",
    "Mary Ann",
    "José",
    "李明",
    "Müller",
    // periods: OAuth-provided names (e.g. GitLab "john.doe"), initials and suffixes
    "john.doe",
    "J. R. R. Tolkien",
    "Martin Luther King Jr.",
  ])("accepts %j", (name) => {
    expect(validatePersonName(name)).toBe(true);
  });

  it.each(["", "   "])("requires a non-empty name (%j)", (name) => {
    expect(validatePersonName(name)).toBe("Name is required");
  });

  it("rejects names longer than 50 characters", () => {
    expect(validatePersonName("a".repeat(51))).toBe("Name must be 50 characters or less");
  });

  it.each(["John<script>", 'John"', "John{}", "John!", "John#1", "50%"])(
    "rejects injection-risk characters in %j",
    (name) => {
      expect(validatePersonName(name)).toMatch(/cannot contain special characters/);
    }
  );

  it.each(["john_doe", "john123", "john@doe", "john/doe", "john,doe"])(
    "rejects other disallowed characters in %j with a message listing what is allowed",
    (name) => {
      expect(validatePersonName(name)).toBe(
        "Names can only contain letters, spaces, periods, hyphens, and apostrophes"
      );
    }
  );
});
