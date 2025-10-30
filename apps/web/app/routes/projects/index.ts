import { layout } from "@react-router/dev/routes";
import type { RouteConfigEntry } from "@react-router/dev/routes";
import { projectRoutes } from "./project";
import { teamspaceRoutes } from "./teamspace";
import { workspaceRoutes } from "./workspace";

export const projectsAppRoutes: RouteConfigEntry[] = [
  layout("./(all)/[workspaceSlug]/(projects)/layout.tsx", [...workspaceRoutes, ...teamspaceRoutes, ...projectRoutes]),
];
