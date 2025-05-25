import { type RouteConfig, route, layout } from "@react-router/dev/routes";

export default [
  layout("/", "./layout.tsx", [
    route("ai", "./ai/layout.tsx"),
    route("authentication", "./authentication/layout.tsx"),
    route("email", "./email/layout.tsx"),
    route("general", "./general/layout.tsx"),
    route("image", "./image/layout.tsx"),
    route("workspace", "./workspace/layout.tsx"),
  ]),
] satisfies RouteConfig;
