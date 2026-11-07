/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { chmod, chown as fsChown, lstat, mkdir } from "node:fs/promises";
import path from "node:path";

import type { IsolationMode } from "./config.ts";
import { UidAllocator } from "./uids.ts";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

/** Where one agent process lives, and as whom it runs. */
export interface WorkspaceLayout {
  /** `<root>/<workspace_id>/<user_id>`: the ACP `cwd` and the process's working directory. */
  readonly cwd: string;
  /** Private `HOME` (agent CLIs keep their session history here, so `session/load` works). */
  readonly home: string;
  /** Private `TMPDIR`, so agents never share `/tmp` with each other. */
  readonly tmp: string;
  /** Set in `uid` isolation; absent in `none`. */
  readonly uid?: number;
  readonly gid?: number;
}

export type Chown = (target: string, uid: number, gid: number) => Promise<void>;

export interface WorkspaceManagerOptions {
  readonly root: string;
  readonly isolation: IsolationMode;
  readonly uidRange: { readonly min: number; readonly max: number };
  /** Injected in tests; the real one needs root. */
  readonly chown?: Chown;
}

/**
 * Prepares the per-user, per-workspace directories on the workspaces volume:
 *
 * ```
 * <root>/                         0711 runner   (traversable, not listable)
 * <root>/.runner/uids.json        0700/0600     uid map
 * <root>/<ws>/                    0711 runner
 * <root>/<ws>/<user>/             0700 uid      cwd, persistent
 * <root>/.homes/<ws>/<user>/      0700 uid      HOME
 * <root>/.tmp/<ws>/<user>/        0700 uid      TMPDIR
 * ```
 *
 * Every directory the runner creates or chowns sits in a parent only the runner can write, so an
 * agent cannot swap one for a symlink and trick the runner into chowning something else.
 */
export class WorkspaceManager {
  readonly #root: string;
  readonly #isolation: IsolationMode;
  readonly #allocator: UidAllocator;
  readonly #chown: Chown;
  #rootReady: Promise<void> | undefined;

  constructor(options: WorkspaceManagerOptions) {
    this.#root = path.resolve(options.root);
    this.#isolation = options.isolation;
    this.#allocator = new UidAllocator({
      file: path.join(this.#root, ".runner", "uids.json"),
      min: options.uidRange.min,
      max: options.uidRange.max,
    });
    this.#chown = options.chown ?? fsChown;
  }

  get root(): string {
    return this.#root;
  }

  /** The cwd the bridge puts in `session/new`; both sides derive it the same way. */
  cwdFor(workspaceId: string, userId: string): string {
    return path.join(this.#root, workspaceId, userId);
  }

  async prepare(workspaceId: string, userId: string): Promise<WorkspaceLayout> {
    // Ids become path segments: only canonical lowercase UUIDs, so nothing can traverse.
    if (!UUID.test(workspaceId) || !UUID.test(userId)) throw new Error("workspace and user ids must be UUIDs");
    const rootReady = this.#rootReady ?? this.#prepareRoot();
    this.#rootReady = rootReady;
    try {
      await rootReady;
    } catch (error) {
      this.#rootReady = undefined;
      throw error;
    }

    const owner = this.#isolation === "uid" ? await this.#allocator.uidFor(`${workspaceId}/${userId}`) : undefined;
    const cwd = this.cwdFor(workspaceId, userId);
    const home = path.join(this.#root, ".homes", workspaceId, userId);
    const tmp = path.join(this.#root, ".tmp", workspaceId, userId);
    for (const parent of [path.dirname(cwd), path.dirname(home), path.dirname(tmp)]) {
      // oxlint-disable-next-line no-await-in-loop -- parents first, in order
      await this.#ensureDir(parent, 0o711);
    }
    for (const dir of [cwd, home, tmp]) {
      // oxlint-disable-next-line no-await-in-loop -- one dir at a time keeps errors attributable
      await this.#ensureDir(dir, 0o700, owner);
    }
    return owner === undefined ? { cwd, home, tmp } : { cwd, home, tmp, uid: owner, gid: owner };
  }

  async #prepareRoot(): Promise<void> {
    await mkdir(this.#root, { recursive: true });
    await this.#ensureDir(this.#root, 0o711);
    await this.#ensureDir(path.join(this.#root, ".runner"), 0o700);
    await this.#ensureDir(path.join(this.#root, ".homes"), 0o711);
    await this.#ensureDir(path.join(this.#root, ".tmp"), 0o711);
  }

  async #ensureDir(dir: string, mode: number, owner?: number): Promise<void> {
    try {
      await mkdir(dir, { mode });
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
    }
    const stat = await lstat(dir);
    if (stat.isSymbolicLink() || !stat.isDirectory()) throw new Error(`${dir} is not a directory`);
    if (owner !== undefined && (stat.uid !== owner || stat.gid !== owner)) await this.#chown(dir, owner, owner);
    // mkdir's mode is filtered by the umask; set it exactly.
    if ((stat.mode & 0o777) !== mode) await chmod(dir, mode);
  }
}
