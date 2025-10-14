import type { RouteConfig } from "@react-router/dev/routes";
import { index, layout, route } from "@react-router/dev/routes";

export default [
  index("./page.tsx"),
  route(":workspaceSlug/:projectId", "./[workspaceSlug]/[projectId]/page.tsx"),
  layout("./issues/[anchor]/client-layout.tsx", [route("issues/:anchor", "./issues/[anchor]/page.tsx")]),
  layout("./views/[anchor]/layout.tsx", [route("views/:anchor", "./views/[anchor]/page.tsx")]),
  // Catch-all route for 404 handling
  route("*", "./not-found.tsx"),
] satisfies RouteConfig;
