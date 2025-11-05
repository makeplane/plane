import { redirect } from "react-router";
import type { Route } from "./+types/analytics";

export const clientLoader = ({ params }: Route.ClientLoaderArgs) => {
  const { workspaceSlug } = params;
  throw redirect(`/${workspaceSlug}/analytics/overview/`);
};

export default function Analytics() {
  return null;
}
