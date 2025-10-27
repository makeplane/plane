import { Outlet } from "react-router";
import type { Route } from "./+types/layout";

export const meta: Route.MetaFunction = () => [
  { title: "Sign up - Plane" },
  { name: "robots", content: "index, nofollow" },
];

export default function SignUpLayout() {
  return <Outlet />;
}
