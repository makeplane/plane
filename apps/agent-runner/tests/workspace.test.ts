/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { lstatSync, mkdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { UidAllocator } from "../src/uids.ts";
import { WorkspaceManager, type Chown } from "../src/workspace.ts";
import { OTHER_USER_ID, USER_ID, WORKSPACE_ID, tempRoot } from "./helpers.ts";

const OTHER_WORKSPACE_ID = "66666666-6666-4666-8666-666666666666";
const mode = (target: string) => lstatSync(target).mode & 0o777;

function recordingChown(): { chown: Chown; calls: [string, number, number][] } {
  const calls: [string, number, number][] = [];
  return { calls, chown: async (target, uid, gid) => void calls.push([target, uid, gid]) };
}

describe("UidAllocator", () => {
  it("allocates distinct uids per key, stable across restarts", async () => {
    const root = tempRoot();
    const file = path.join(root, "uids.json");
    const first = new UidAllocator({ file, min: 30_000, max: 30_009 });
    const keys = ["a/1", "a/2", "b/1"];
    const uids = await Promise.all(keys.map((key) => first.uidFor(key)));
    expect(uids).toEqual([30_000, 30_001, 30_002]);
    expect(await first.uidFor("a/1")).toBe(30_000);
    expect(lstatSync(file).mode & 0o777).toBe(0o600);

    const restarted = new UidAllocator({ file, min: 30_000, max: 30_009 });
    expect(await restarted.uidFor("b/1")).toBe(30_002);
    expect(await restarted.uidFor("c/1")).toBe(30_003);
    expect(JSON.parse(readFileSync(file, "utf8"))).toEqual({
      version: 1,
      uids: { "a/1": 30_000, "a/2": 30_001, "b/1": 30_002, "c/1": 30_003 },
    });
  });

  it("fails when the range is exhausted", async () => {
    const allocator = new UidAllocator({ file: path.join(tempRoot(), "uids.json"), min: 40_000, max: 40_001 });
    await allocator.uidFor("a");
    await allocator.uidFor("b");
    await expect(allocator.uidFor("c")).rejects.toThrow(/exhausted/);
    expect(await allocator.uidFor("a")).toBe(40_000);
  });

  it("refuses a damaged map instead of reusing uids", async () => {
    const root = tempRoot();
    const file = path.join(root, "uids.json");
    writeFileSync(file, "{not json");
    await expect(new UidAllocator({ file, min: 1_000, max: 2_000 }).uidFor("a")).rejects.toThrow();
    writeFileSync(file, JSON.stringify({ version: 1, uids: { a: 1_000, b: 1_000 } }));
    await expect(new UidAllocator({ file, min: 1_000, max: 2_000 }).uidFor("c")).rejects.toThrow(/invalid entry/);
  });
});

describe("WorkspaceManager", () => {
  it("lays out private 0700 dirs under traversable 0711 parents", async () => {
    const root = tempRoot();
    const manager = new WorkspaceManager({ root, isolation: "none", uidRange: { min: 20_000, max: 20_009 } });
    const layout = await manager.prepare(WORKSPACE_ID, USER_ID);
    expect(layout).toEqual({
      cwd: path.join(root, WORKSPACE_ID, USER_ID),
      home: path.join(root, ".homes", WORKSPACE_ID, USER_ID),
      tmp: path.join(root, ".tmp", WORKSPACE_ID, USER_ID),
    });
    for (const dir of [layout.cwd, layout.home, layout.tmp, path.join(root, ".runner")]) expect(mode(dir)).toBe(0o700);
    for (const dir of [root, path.join(root, WORKSPACE_ID), path.join(root, ".homes"), path.join(root, ".tmp")]) {
      expect(mode(dir)).toBe(0o711);
    }
    // Idempotent, and it restores modes an agent loosened.
    writeFileSync(path.join(layout.cwd, "notes.md"), "kept");
    rmSync(layout.tmp, { recursive: true });
    await manager.prepare(WORKSPACE_ID, USER_ID);
    expect(readFileSync(path.join(layout.cwd, "notes.md"), "utf8")).toBe("kept");
    expect(mode(layout.tmp)).toBe(0o700);
  });

  it("gives each user and workspace its own uid and chowns only their dirs (uid isolation)", async () => {
    const root = tempRoot();
    const { chown, calls } = recordingChown();
    const manager = new WorkspaceManager({ root, isolation: "uid", uidRange: { min: 20_000, max: 20_009 }, chown });
    const mine = await manager.prepare(WORKSPACE_ID, USER_ID);
    const colleague = await manager.prepare(WORKSPACE_ID, OTHER_USER_ID);
    const elsewhere = await manager.prepare(OTHER_WORKSPACE_ID, USER_ID);
    expect([mine.uid, colleague.uid, elsewhere.uid]).toEqual([20_000, 20_001, 20_002]);
    expect(mine.gid).toBe(mine.uid);
    expect(new Set([mine.cwd, colleague.cwd, elsewhere.cwd]).size).toBe(3);
    expect(calls).toEqual(
      [mine, colleague, elsewhere].flatMap((layout) =>
        [layout.cwd, layout.home, layout.tmp].map((dir) => [dir, layout.uid, layout.uid])
      )
    );
    expect((await manager.prepare(WORKSPACE_ID, USER_ID)).uid).toBe(20_000);
  });

  it("rejects ids that are not UUIDs (no path traversal)", async () => {
    const manager = new WorkspaceManager({ root: tempRoot(), isolation: "none", uidRange: { min: 2_000, max: 2_001 } });
    for (const [ws, user] of [
      ["..", USER_ID],
      [WORKSPACE_ID, "../../etc"],
      ["ABCDEF00-0000-4000-8000-000000000000", USER_ID],
      [WORKSPACE_ID, `${USER_ID}/x`],
    ]) {
      // oxlint-disable-next-line no-await-in-loop -- one case at a time
      await expect(manager.prepare(ws!, user!)).rejects.toThrow(/UUID/);
    }
  });

  it("refuses to adopt a symlink planted where a dir should be", async () => {
    const root = tempRoot();
    const target = tempRoot("victim-");
    mkdirSync(path.join(root, WORKSPACE_ID), { recursive: true });
    symlinkSync(target, path.join(root, WORKSPACE_ID, USER_ID));
    const { chown, calls } = recordingChown();
    const manager = new WorkspaceManager({ root, isolation: "uid", uidRange: { min: 2_000, max: 2_001 }, chown });
    await expect(manager.prepare(WORKSPACE_ID, USER_ID)).rejects.toThrow(/not a directory/);
    expect(calls.some(([dir]) => dir.includes(USER_ID) && !dir.includes(".homes") && !dir.includes(".tmp"))).toBe(
      false
    );
  });
});
