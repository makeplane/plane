import { redirect } from "react-router";
import type { ClientLoaderFunctionArgs } from "react-router";

export const clientLoader = ({ params }: ClientLoaderFunctionArgs) => {
  const { workspaceSlug } = params;
  throw redirect(`/${workspaceSlug}/analytics/overview/`);
};

export default function Analytics() {
  return null;
}

