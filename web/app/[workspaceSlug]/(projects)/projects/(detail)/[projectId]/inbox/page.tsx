import { redirect } from "next/navigation";

interface PageProps {
  params: {
    workspaceSlug: string;
    projectId: string;
  };
}

export default async function InboxPage({ params: { workspaceSlug, projectId } }: PageProps) {
  return redirect(`/${workspaceSlug}/projects/${projectId}/intake/`);
}
