import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { log } from "./log";
import { matchesCheck } from "../registry";
import type { Check, ContentItem } from "../types";

export type ReadFile = (path: string) => string;

/**
 * Lists tracked files only. Using git rather than a filesystem walk keeps
 * ignored directories (node_modules, build output) out of a Baseline Scan.
 */
export function listTrackedFiles(): string[] {
  const output = execFileSync("git", ["ls-files"], {
    encoding: "utf-8",
    maxBuffer: 64 * 1024 * 1024,
  });
  return output.split("\n").filter((line) => line.length > 0);
}

export function selectFilesForChecks(files: readonly string[], checks: readonly Check[]): string[] {
  return files.filter((file) => checks.some((check) => matchesCheck(check, file)));
}

export function readContentItems(
  paths: readonly string[],
  read: ReadFile = (path) => readFileSync(path, "utf-8")
): ContentItem[] {
  const items: ContentItem[] = [];

  for (const path of paths) {
    try {
      items.push({ path, content: read(path) });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      log.warn(`Skipping unreadable file ${path}: ${message}`);
    }
  }

  return items;
}
