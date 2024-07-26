import { notFound, redirect } from "next/navigation";
// types
import { TProjectPublishSettings } from "@plane/types";
// services
import PublishService from "@/services/publish.service";

const publishService = new PublishService();

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
    response = await publishService.fetchAnchorFromProjectDetails(workspaceSlug, projectId);
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
