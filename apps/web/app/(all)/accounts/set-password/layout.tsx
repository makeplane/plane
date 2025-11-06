import { Outlet } from "react-router";
import type { Route } from "./+types/layout";

export default function SetPasswordLayout() {
  return <Outlet />;
}

export const meta: Route.MetaFunction = () => [{ title: "Set Password - Plane" }];
