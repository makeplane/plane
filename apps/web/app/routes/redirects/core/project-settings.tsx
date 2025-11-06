import { redirect } from "react-router";
import type { Route } from "./+types/project-settings";

export const clientLoader = ({ params }: Route.ClientLoaderArgs) => {
  const { workspaceSlug, projectId } = params;
  const splat = params["*"] || "";
  const destination = `/${workspaceSlug}/settings/projects/${projectId}${splat ? `/${splat}` : ""}/`;
  throw redirect(destination);
};

export default function ProjectSettings() {
  return null;
}
