import { Outlet } from "react-router";
import type { Route } from "./+types/layout";

export default function InvitationsLayout() {
  return <Outlet />;
}

export const meta: Route.MetaFunction = () => [{ title: "Invitations" }];
