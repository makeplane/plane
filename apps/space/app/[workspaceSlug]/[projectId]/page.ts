import { notFound, redirect } from "next/navigation";
// plane imports
import { SitesProjectPublishService } from "@plane/services";
import { TProjectPublishSettings } from "@plane/types";

const publishService = new SitesProjectPublishService();

type Props = {
  params: {
    workspaceSlug: string;
    projectId: string;
  };
  searchParams: any;
};

export default async function IssuesPage(props: Props) {
  const { params, searchParams } = props;
  // query params
  const { workspaceSlug, projectId } = params;
  const { board, peekId } = searchParams;

  let response: TProjectPublishSettings | undefined = undefined;
  try {
    response = await publishService.retrieveSettingsByProjectId(workspaceSlug, projectId);
  } catch (error) {
    // redirect to 404 page on error
    notFound();
  }

  let url = "";
  if (response?.entity_name === "project") {
    url = `/issues/${response?.anchor}`;
    const params = new URLSearchParams();
    if (board) params.append("board", board);
    if (peekId) params.append("peekId", peekId);
    if (params.toString()) url += `?${params.toString()}`;
    redirect(url);
  } else {
    notFound();
  }
}
