import { Outlet } from "react-router";
import type { Route } from "./+types/layout";

export default function CreateWorkspaceLayout() {
  return <Outlet />;
}

export const meta: Route.MetaFunction = () => [{ title: "Create Workspace" }];
