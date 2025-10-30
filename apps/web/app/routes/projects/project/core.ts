import { layout, route } from "@react-router/dev/routes";
import type { RouteConfigEntry } from "@react-router/dev/routes";
import { workspaceRoute } from "../../utils";

export const coreProjectRoutes: RouteConfigEntry[] = [
  // ========================================================================
  // PROJECT LIST
  // ========================================================================
  layout("./(all)/[workspaceSlug]/(projects)/projects/(list)/layout.tsx", [
    route(workspaceRoute("projects"), "./(all)/[workspaceSlug]/(projects)/projects/(list)/page.tsx"),
  ]),
] as const;
