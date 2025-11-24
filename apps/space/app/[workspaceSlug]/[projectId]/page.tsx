import { redirect } from "react-router";
// plane imports
import { SitesProjectPublishService } from "@plane/services";
import type { TProjectPublishSettings } from "@plane/types";
// components
import { LogoSpinner } from "@/components/common/logo-spinner";
import type { Route } from "./+types/page";

const publishService = new SitesProjectPublishService();

export const clientLoader = async ({ params, request }: Route.ClientLoaderArgs) => {
  const { workspaceSlug, projectId } = params;

  // Validate required params
  if (!workspaceSlug || !projectId) {
    throw redirect("/404");
  }

  // Extract query params from the request URL
  const url = new URL(request.url);
  const board = url.searchParams.get("board");
  const peekId = url.searchParams.get("peekId");

  let response: TProjectPublishSettings | undefined = undefined;

  try {
    response = await publishService.retrieveSettingsByProjectId(workspaceSlug, projectId);
  } catch {
    throw redirect("/404");
  }

  if (response?.entity_name === "project") {
    let redirectUrl = `/issues/${response?.anchor}`;
    const urlParams = new URLSearchParams();
    if (board) urlParams.append("board", String(board));
    if (peekId) urlParams.append("peekId", String(peekId));
    if (urlParams.toString()) redirectUrl += `?${urlParams.toString()}`;

    throw redirect(redirectUrl);
  } else {
    throw redirect("/404");
  }
};

export default function IssuesPage() {
  return (
    <div className="flex h-screen min-h-[500px] w-full justify-center items-center">
      <LogoSpinner />
    </div>
  );
}
