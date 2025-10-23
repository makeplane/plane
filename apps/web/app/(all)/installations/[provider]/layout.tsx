import { Outlet } from "react-router";
import type { Route } from "./+types/layout";

export default function InstallationProviderLayout() {
  return <Outlet />;
}

export const meta: Route.MetaFunction = () => [{ title: "Installations" }];
