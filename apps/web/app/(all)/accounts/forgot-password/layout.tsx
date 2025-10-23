import { Outlet } from "react-router";
import type { Route } from "./+types/layout";

export default function ForgotPasswordLayout() {
  return <Outlet />;
}

export const meta: Route.MetaFunction = () => [{ title: "Forgot Password - Plane" }];
