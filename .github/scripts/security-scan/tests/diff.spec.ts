import { describe, expect, it } from "vitest";
import { parseDiff } from "../lib/diff";

describe("parseDiff", () => {
  it("extracts one content item per modified file, keyed by the new path", () => {
    const diff = [
      "diff --git a/apps/api/plane/app/views/member.py b/apps/api/plane/app/views/member.py",
      "index 1111111..2222222 100644",
      "--- a/apps/api/plane/app/views/member.py",
      "+++ b/apps/api/plane/app/views/member.py",
      "@@ -10,3 +10,4 @@ class MemberView:",
      " def get(self, request, member_id):",
      "+    member = Member.objects.get(id=member_id)",
      "     return Response(member)",
      "",
    ].join("\n");

    const items = parseDiff(diff);

    expect(items).toHaveLength(1);
    expect(items[0]?.path).toBe("apps/api/plane/app/views/member.py");
    expect(items[0]?.content).toContain("member = Member.objects.get(id=member_id)");
  });

  it("concatenates multiple hunks in the same file into one item", () => {
    const diff = [
      "diff --git a/apps/api/plane/app/views/member.py b/apps/api/plane/app/views/member.py",
      "index 1111111..2222222 100644",
      "--- a/apps/api/plane/app/views/member.py",
      "+++ b/apps/api/plane/app/views/member.py",
      "@@ -1,2 +1,3 @@",
      "+import first",
      " existing",
      "@@ -20,2 +21,3 @@",
      "+import second",
      " existing_too",
      "",
    ].join("\n");

    const items = parseDiff(diff);

    expect(items).toHaveLength(1);
    expect(items[0]?.content).toContain("import first");
    expect(items[0]?.content).toContain("import second");
  });

  it("uses the new path for a renamed file that also changed content", () => {
    const diff = [
      "diff --git a/apps/api/plane/app/views/old_name.py b/apps/api/plane/app/views/new_name.py",
      "similarity index 90%",
      "rename from apps/api/plane/app/views/old_name.py",
      "rename to apps/api/plane/app/views/new_name.py",
      "index 1111111..2222222 100644",
      "--- a/apps/api/plane/app/views/old_name.py",
      "+++ b/apps/api/plane/app/views/new_name.py",
      "@@ -1,2 +1,3 @@",
      "+added_line = True",
      " existing",
      "",
    ].join("\n");

    const items = parseDiff(diff);

    expect(items).toHaveLength(1);
    expect(items[0]?.path).toBe("apps/api/plane/app/views/new_name.py");
    expect(items[0]?.content).toContain("added_line = True");
  });

  it("excludes a pure rename with no content change", () => {
    const diff = [
      "diff --git a/apps/api/plane/app/views/old_name.py b/apps/api/plane/app/views/new_name.py",
      "similarity index 100%",
      "rename from apps/api/plane/app/views/old_name.py",
      "rename to apps/api/plane/app/views/new_name.py",
      "",
    ].join("\n");

    const items = parseDiff(diff);

    expect(items).toHaveLength(0);
  });

  it("excludes binary files", () => {
    const diff = [
      "diff --git a/apps/web/public/logo.png b/apps/web/public/logo.png",
      "index 1111111..2222222 100644",
      "Binary files a/apps/web/public/logo.png and b/apps/web/public/logo.png differ",
      "",
    ].join("\n");

    const items = parseDiff(diff);

    expect(items).toHaveLength(0);
  });

  it("excludes deleted files", () => {
    const diff = [
      "diff --git a/apps/api/plane/app/views/removed.py b/apps/api/plane/app/views/removed.py",
      "deleted file mode 100644",
      "index 1111111..0000000",
      "--- a/apps/api/plane/app/views/removed.py",
      "+++ /dev/null",
      "@@ -1,3 +0,0 @@",
      "-def gone():",
      "-    pass",
      "",
    ].join("\n");

    const items = parseDiff(diff);

    expect(items).toHaveLength(0);
  });

  it("returns items in file order across multiple changed files", () => {
    const diff = [
      "diff --git a/apps/api/plane/app/views/a.py b/apps/api/plane/app/views/a.py",
      "--- a/apps/api/plane/app/views/a.py",
      "+++ b/apps/api/plane/app/views/a.py",
      "@@ -1,1 +1,2 @@",
      "+first_file_change",
      " existing",
      "diff --git a/apps/api/plane/app/views/b.py b/apps/api/plane/app/views/b.py",
      "--- a/apps/api/plane/app/views/b.py",
      "+++ b/apps/api/plane/app/views/b.py",
      "@@ -1,1 +1,2 @@",
      "+second_file_change",
      " existing",
      "",
    ].join("\n");

    const items = parseDiff(diff);

    expect(items.map((item) => item.path)).toEqual(["apps/api/plane/app/views/a.py", "apps/api/plane/app/views/b.py"]);
  });

  it("returns an empty array for an empty diff", () => {
    expect(parseDiff("")).toEqual([]);
  });
});
