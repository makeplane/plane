import { layout, route } from "@react-router/dev/routes";
import type { RouteConfigEntry } from "@react-router/dev/routes";

export const coreStandaloneRoutes: RouteConfigEntry[] = [
  // ========================================================================
  // OAUTH INSTALLATIONS
  // ========================================================================
  layout("./(all)/installations/[provider]/layout.tsx", [
    route("installations/:provider", "./(all)/installations/[provider]/page.tsx"),
  ]),
] as const;
