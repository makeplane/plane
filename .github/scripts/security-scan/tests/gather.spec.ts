import { describe, expect, it, vi } from "vitest";
import { listTrackedFiles, selectFilesForChecks, readContentItems } from "../lib/gather";
import type { Check } from "../types";

const CHECK: Check = {
  id: "test_check",
  description: "test",
  targetGlobs: ["apps/api/plane/**/views/**/*.py"],
  prompt: "p",
};

describe("selectFilesForChecks", () => {
  it("keeps only files matching at least one check's globs", () => {
    const selected = selectFilesForChecks(
      [
        "apps/api/plane/app/views/member.py",
        "apps/web/core/components/settings.tsx",
        "apps/api/plane/db/models/workspace.py",
      ],
      [CHECK]
    );

    expect(selected).toEqual(["apps/api/plane/app/views/member.py"]);
  });

  it("de-duplicates a file matched by more than one check", () => {
    const other: Check = { ...CHECK, id: "other_check" };

    const selected = selectFilesForChecks(["apps/api/plane/app/views/member.py"], [CHECK, other]);

    expect(selected).toEqual(["apps/api/plane/app/views/member.py"]);
  });

  it("returns nothing when no file matches", () => {
    expect(selectFilesForChecks(["README.md"], [CHECK])).toEqual([]);
  });
});

describe("listTrackedFiles", () => {
  it("lists tracked files without blank entries", () => {
    const files = listTrackedFiles();

    expect(files.length).toBeGreaterThan(0);
    expect(files.every((file) => file.length > 0)).toBe(true);
  });

  it("excludes untracked and ignored paths such as node_modules", () => {
    const files = listTrackedFiles();

    expect(files.some((file) => file.includes("node_modules/"))).toBe(false);
  });
});

describe("readContentItems", () => {
  it("pairs each path with its file contents", () => {
    const read = vi.fn().mockReturnValue("file body");

    const items = readContentItems(["a.py"], read);

    expect(items).toEqual([{ path: "a.py", content: "file body" }]);
  });

  it("skips a file that cannot be read rather than aborting the whole scan", () => {
    const read = vi.fn((path: string) => {
      if (path === "broken.py") {
        throw new Error("EACCES");
      }
      return "ok";
    });

    const items = readContentItems(["broken.py", "fine.py"], read);

    expect(items).toEqual([{ path: "fine.py", content: "ok" }]);
  });
});
