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
  validatePersonName,
  validateSlug,
  validateWorkspaceName,
} from "../src/validation";

describe("validatePersonName", () => {
  it("should accept valid standard names", () => {
    expect(validatePersonName("John")).toBe(true);
    expect(validatePersonName("Jane Doe")).toBe(true);
    expect(validatePersonName("Jean-Paul")).toBe(true);
    expect(validatePersonName("Mary-Jane Watson-Parker")).toBe(true);
  });

  it("should accept valid international names with apostrophes", () => {
    expect(validatePersonName("O'Brien")).toBe(true);
    expect(validatePersonName("D'Angelo")).toBe(true);
    expect(validatePersonName("O'Connor")).toBe(true);
    expect(validatePersonName("N'Golo")).toBe(true);
    expect(validatePersonName("D'Souza")).toBe(true);
  });

  it("should accept international names with Unicode characters", () => {
    expect(validatePersonName("José")).toBe(true);
    expect(validatePersonName("Müller")).toBe(true);
    expect(validatePersonName("李明")).toBe(true);
    expect(validatePersonName("محمد")).toBe(true);
    expect(validatePersonName("Александр")).toBe(true);
    expect(validatePersonName("Åse")).toBe(true);
  });

  it("should reject empty or whitespace-only names", () => {
    expect(validatePersonName("")).toBe("Name is required");
    expect(validatePersonName("   ")).toBe("Name is required");
  });

  it("should reject names that exceed 50 characters", () => {
    const longName = "A".repeat(51);
    expect(validatePersonName(longName)).toBe("Name must be 50 characters or less");
  });

  it("should reject names containing injection characters with dedicated injection message", () => {
    expect(validatePersonName("John<script>")).toBe(
      'Names cannot contain special characters like < > " { } [ ] * ^ ! # %'
    );
    expect(validatePersonName("John{admin}")).toBe(
      'Names cannot contain special characters like < > " { } [ ] * ^ ! # %'
    );
    expect(validatePersonName("John*")).toBe('Names cannot contain special characters like < > " { } [ ] * ^ ! # %');
    expect(validatePersonName("John#1")).toBe('Names cannot contain special characters like < > " { } [ ] * ^ ! # %');
  });

  it("should reject names with numbers or unauthorized characters with format message", () => {
    expect(validatePersonName("John123")).toBe("Names can only contain letters, spaces, hyphens, and apostrophes");
    expect(validatePersonName("John Doe @ Work")).toBe(
      "Names can only contain letters, spaces, hyphens, and apostrophes"
    );
    expect(validatePersonName("Robert); DROP TABLE Students;--")).toBe(
      "Names can only contain letters, spaces, hyphens, and apostrophes"
    );
  });
});

describe("validateDisplayName", () => {
  it("should accept valid usernames and display names", () => {
    expect(validateDisplayName("john_doe")).toBe(true);
    expect(validateDisplayName("john.doe-123")).toBe(true);
    expect(validateDisplayName("josé_123")).toBe(true);
    expect(validateDisplayName("李明.dev")).toBe(true);
  });

  it("should allow empty display names as it is optional", () => {
    expect(validateDisplayName("")).toBe(true);
    expect(validateDisplayName("   ")).toBe(true);
  });

  it("should reject display names with spaces or injection characters", () => {
    expect(validateDisplayName("john doe")).toBe(
      "Display name can only contain letters, numbers, periods, hyphens, and underscores"
    );
    expect(validateDisplayName("john<script>")).toBe(
      "Display name cannot contain special characters like < > ' \" { } [ ] * ^ ! # %"
    );
  });
});

describe("validateCompanyName & validateWorkspaceName", () => {
  it("should accept valid company and workspace names", () => {
    expect(validateCompanyName("Acme Corp")).toBe(true);
    expect(validateCompanyName("Acme_Corp-123")).toBe(true);
    expect(validateWorkspaceName("My Workspace")).toBe(true);
    expect(validateWorkspaceName("Société Générale")).toBe(true);
  });

  it("should reject names containing injection characters", () => {
    expect(validateCompanyName("Acme{Corp}")).toBe(
      "Company name cannot contain special characters like < > ' \" { } [ ] * ^ ! # %"
    );
    expect(validateWorkspaceName("Work<space>")).toBe(
      "Workspace name cannot contain special characters like < > ' \" { } [ ] * ^ ! # %"
    );
  });

  it("should reject names without any alphanumeric characters", () => {
    expect(validateCompanyName("---___---", true)).toBe("Company name must contain at least one letter or number");
    expect(validateWorkspaceName("---___---", true)).toBe("Workspace name must contain at least one letter or number");
  });
});

describe("validateSlug", () => {
  it("should accept valid slugs", () => {
    expect(validateSlug("my-workspace")).toBe(true);
    expect(validateSlug("my_workspace_123")).toBe(true);
    expect(validateSlug("josé-workspace")).toBe(true);
  });

  it("should reject spaces, injection chars, and special symbols", () => {
    expect(validateSlug("my workspace")).toBe("Slug can only contain letters, numbers, hyphens, and underscores");
    expect(validateSlug("slug<script>")).toBe("Slug cannot contain special characters like < > ' \" { } [ ] * ^ ! # %");
  });
});

describe("hasInjectionRiskChars", () => {
  it("should return false for safe strings without injection characters", () => {
    expect(hasInjectionRiskChars("Hello World")).toBe(false);
    expect(hasInjectionRiskChars("my-workspace-123")).toBe(false);
  });

  it("should return true for strings containing injection characters", () => {
    expect(hasInjectionRiskChars("Hello<script>")).toBe(true);
    expect(hasInjectionRiskChars("user' OR '1'='1")).toBe(true);
    expect(hasInjectionRiskChars("${inject}")).toBe(true);
    expect(hasInjectionRiskChars("array[0]")).toBe(true);
  });

  it("should allow apostrophes when allowApostrophe option is true", () => {
    expect(hasInjectionRiskChars("O'Brien", { allowApostrophe: true })).toBe(false);
    expect(hasInjectionRiskChars("D'Angelo", { allowApostrophe: true })).toBe(false);
    expect(hasInjectionRiskChars("O'Brien<script>", { allowApostrophe: true })).toBe(true);
  });
});
