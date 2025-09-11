import {
  type RouteConfig,
  index,
  layout,
  route,
} from "@react-router/dev/routes";

export default [
  route("", "routes/layout.tsx", [
    index("routes/home.tsx"),
    // route("ai", "routes/ai/page.tsx"),
    // route("authentication", "routes/authentication/page.tsx"),
    // route("email", "routes/email/page.tsx"),
    // route("general", "routes/general/page.tsx"),
    // route("image", "routes/image/page.tsx"),
    // route("workspace", "routes/workspace/page.tsx"),
  ]),
] satisfies RouteConfig;
