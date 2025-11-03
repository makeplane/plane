import { redirect } from "react-router";
import type { ClientLoaderFunctionArgs } from "react-router";

export const clientLoader = ({ params }: ClientLoaderFunctionArgs) => {
  const { workspaceSlug, projectId } = params;
  const splat = params["*"] || "";
  const destination = `/${workspaceSlug}/settings/projects/${projectId}${splat ? `/${splat}` : ""}/`;
  throw redirect(destination);
};

export default function ProjectSettings() {
  return null;
}

