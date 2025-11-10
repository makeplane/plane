import { Outlet } from "react-router";
import type { Route } from "./+types/layout";

export default function ResetPasswordLayout() {
  return <Outlet />;
}

export const meta: Route.MetaFunction = () => [{ title: "Reset Password - Plane" }];
