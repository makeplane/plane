import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { Check } from "../../types";

const currentDir = path.dirname(fileURLToPath(import.meta.url));

export const multiTenancyIsolationCheck: Check = {
  id: "multi_tenancy_isolation",
  description:
    "Flags request-supplied ids used against workspace/project/member-scoped " +
    "resources without server-side ownership verification.",
  targetGlobs: [
    "apps/api/plane/**/views/**/*.py",
    "apps/api/plane/**/serializers/**/*.py",
    "apps/api/plane/**/permissions/**/*.py",
  ],
  prompt: readFileSync(path.join(currentDir, "prompt.md"), "utf-8"),
};
