import picomatch from "picomatch";
import { multiTenancyIsolationCheck } from "./checks/multi-tenancy-isolation/check";
import type { Check } from "./types";

export const checks: readonly Check[] = [multiTenancyIsolationCheck];

export function matchesCheck(check: Check, filePath: string): boolean {
  return check.targetGlobs.some((glob) => picomatch(glob)(filePath));
}

export function checksForFile(filePath: string): Check[] {
  return checks.filter((check) => matchesCheck(check, filePath));
}
