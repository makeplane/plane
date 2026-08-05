import { describe, expect, it } from "vitest";
import { checks, checksForFile } from "../registry";

describe("checks registry", () => {
  it("includes the multi_tenancy_isolation check", () => {
    expect(checks.map((check) => check.id)).toContain("multi_tenancy_isolation");
  });
});

describe("checksForFile", () => {
  it("matches a real views file under apps/api", () => {
    const matched = checksForFile("apps/api/plane/app/views/workspace/member.py");
    expect(matched.map((check) => check.id)).toContain("multi_tenancy_isolation");
  });

  it("matches a real serializers file under apps/api", () => {
    const matched = checksForFile("apps/api/plane/app/serializers/workspace.py");
    expect(matched.map((check) => check.id)).toContain("multi_tenancy_isolation");
  });

  it("matches a real permissions file under apps/api", () => {
    const matched = checksForFile("apps/api/plane/app/permissions/project.py");
    expect(matched.map((check) => check.id)).toContain("multi_tenancy_isolation");
  });

  it("excludes a frontend file under apps/web", () => {
    const matched = checksForFile("apps/web/core/components/workspace/settings.tsx");
    expect(matched).toEqual([]);
  });

  it("excludes a non-matching apps/api file (e.g. a model)", () => {
    const matched = checksForFile("apps/api/plane/db/models/workspace.py");
    expect(matched).toEqual([]);
  });
});
