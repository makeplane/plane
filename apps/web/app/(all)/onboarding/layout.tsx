import { Outlet } from "react-router";
import type { Route } from "./+types/layout";

export default function OnboardingLayout() {
  return <Outlet />;
}

export const meta: Route.MetaFunction = () => [{ title: "Onboarding" }];
