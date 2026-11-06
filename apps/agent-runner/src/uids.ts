/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { open, readFile, rename } from "node:fs/promises";

interface UidMapFile {
  readonly version: 1;
  readonly uids: Record<string, number>;
}

/**
 * Gives every workspace dir (`<workspace_id>/<user_id>`) its own uid from a fixed range, and
 * remembers the mapping in a file on the workspaces volume so a dir keeps its owner across
 * restarts and redeploys.
 *
 * One runner process owns the volume; calls are serialised in-process and the file is replaced
 * atomically (write, fsync, rename). A file that cannot be parsed is an error, never a reason to
 * start over: reusing a uid would hand one user's files to another.
 */
export class UidAllocator {
  readonly #file: string;
  readonly #min: number;
  readonly #max: number;
  #map: Map<string, number> | undefined;
  #chain: Promise<unknown> = Promise.resolve();

  constructor(options: { file: string; min: number; max: number }) {
    if (!Number.isSafeInteger(options.min) || options.min < 1 || options.min > options.max) {
      throw new Error("invalid uid range");
    }
    this.#file = options.file;
    this.#min = options.min;
    this.#max = options.max;
  }

  /** The uid for `key`, allocating (and persisting) the lowest free one the first time. */
  uidFor(key: string): Promise<number> {
    const next = this.#chain.then(() => this.#uidFor(key));
    this.#chain = next.catch(() => undefined);
    return next;
  }

  async #uidFor(key: string): Promise<number> {
    const map = await this.#load();
    const existing = map.get(key);
    if (existing !== undefined) return existing;
    const used = new Set(map.values());
    let uid = this.#min;
    while (uid <= this.#max && used.has(uid)) uid += 1;
    if (uid > this.#max) throw new Error(`uid range ${this.#min}-${this.#max} is exhausted`);
    const updated = new Map(map).set(key, uid);
    await this.#save(updated);
    this.#map = updated;
    return uid;
  }

  async #load(): Promise<Map<string, number>> {
    if (this.#map) return this.#map;
    let text: string;
    try {
      text = await readFile(this.#file, "utf8");
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        this.#map = new Map();
        return this.#map;
      }
      throw error;
    }
    const parsed = JSON.parse(text) as Partial<UidMapFile>;
    if (parsed.version !== 1 || typeof parsed.uids !== "object" || parsed.uids === null) {
      throw new Error(`${this.#file} is not a uid map`);
    }
    const map = new Map<string, number>();
    const seen = new Set<number>();
    for (const [key, uid] of Object.entries(parsed.uids)) {
      if (!Number.isSafeInteger(uid) || seen.has(uid)) throw new Error(`${this.#file} has an invalid entry for ${key}`);
      seen.add(uid);
      map.set(key, uid);
    }
    this.#map = map;
    return map;
  }

  async #save(map: Map<string, number>): Promise<void> {
    const body: UidMapFile = { version: 1, uids: Object.fromEntries(map) };
    const tmp = `${this.#file}.${process.pid}.tmp`;
    const handle = await open(tmp, "w", 0o600);
    try {
      await handle.writeFile(`${JSON.stringify(body, null, 2)}\n`);
      await handle.sync();
    } finally {
      await handle.close();
    }
    await rename(tmp, this.#file);
  }
}
