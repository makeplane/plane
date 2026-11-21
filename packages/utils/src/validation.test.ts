/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { describe, expect, it } from "vitest";
import {
  hasInjectionRiskChars,
  validateCompanyName,
  validateDisplayName,
  validateOptionalPersonName,
  validatePersonName,
  validateSlug,
  validateWorkspaceName,
} from "./validation";

describe("validatePersonName", () => {
  it.each(["O'Brien", "D'Arcy", "Jean-Paul", "José", "李明", "محمد", " John ", "John\tPaul", "John\nPaul", "---"])(
    "accepts names allowed by the existing pattern: %j",
    (name) => {
      expect(validatePersonName(name)).toBe(true);
      expect(validateOptionalPersonName(name)).toBe(true);
    }
  );

  it.each(["<", ">", '"', "{", "}", "[", "]", "*", "^", "!", "#", "%"])(
    "still rejects %j when combined with an apostrophe",
    (character) => {
      const name = `O'Brien${character}`;
      expect(validatePersonName(name)).toBe('Names cannot contain special characters like < > " { } [ ] * ^ ! # %');
      expect(validateOptionalPersonName(name)).not.toBe(true);
    }
  );

  it.each([
    "O'Brien<script>",
    "O'Brien1",
    "O'Brien_",
    "O'Brien.",
    "O'Brien/",
    "O'Brien\\",
    "O’Brien",
    "https://example.com",
    "O'Brien\0",
    "O'Brien\u0001",
  ])("preserves rejection of unsupported characters: %j", (name) => {
    expect(validatePersonName(name)).not.toBe(true);
    expect(validateOptionalPersonName(name)).not.toBe(true);
  });

  it("counts apostrophes toward the existing 50-character limit", () => {
    const name = `O'${"a".repeat(48)}`;
    expect(validatePersonName(name)).toBe(true);
    expect(validateOptionalPersonName(name)).toBe(true);
    expect(validatePersonName(`${name}a`)).toBe("Name must be 50 characters or less");
    expect(validateOptionalPersonName(`${name}a`)).toBe("Name must be 50 characters or less");
  });

  it.each(["", " ", "\t\n"])("preserves required and optional blank handling: %j", (name) => {
    expect(validatePersonName(name)).toBe("Name is required");
    expect(validateOptionalPersonName(name)).toBe(true);
  });

  it("allows omitted optional names", () => {
    expect(validateOptionalPersonName()).toBe(true);
  });
});

describe("other input validators", () => {
  it("keeps apostrophes rejected by the shared guard", () => {
    expect(hasInjectionRiskChars("O'Brien")).toBe(true);
  });

  it.each([validateDisplayName, validateCompanyName, validateWorkspaceName, validateSlug])(
    "keeps apostrophes rejected outside person names",
    (validate) => {
      expect(validate("O'Brien")).not.toBe(true);
      expect(validate("Acme")).toBe(true);
    }
  );
});
