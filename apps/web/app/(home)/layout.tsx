import { Outlet } from "react-router";
// types
import type { Route } from "./+types/layout";

export const meta: Route.MetaFunction = () => [
  { name: "robots", content: "index, nofollow" },
  { name: "viewport", content: "width=device-width, initial-scale=1, minimum-scale=1, viewport-fit=cover" },
];

export default function HomeLayout() {
  return <Outlet />;
}
