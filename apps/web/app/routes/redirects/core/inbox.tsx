import { redirect } from "react-router";
import type { ClientLoaderFunctionArgs } from "react-router";

export const clientLoader = ({ params }: ClientLoaderFunctionArgs) => {
  const { workspaceSlug, projectId } = params;
  throw redirect(`/${workspaceSlug}/projects/${projectId}/intake/`);
};

export default function Inbox() {
  return null;
}
