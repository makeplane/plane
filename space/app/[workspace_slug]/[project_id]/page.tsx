"use client";

import { useEffect, useState } from "react";
import { notFound, useSearchParams } from "next/navigation";
// components
import { LogoSpinner } from "@/components/common";
// helpers
import { navigate } from "@/helpers/actions";
// services
import PublishService from "@/services/publish.service";
const publishService = new PublishService();

type Props = {
  params: {
    workspace_slug: string;
    project_id: string;
  };
};

const ProjectIssuesPage = (props: Props) => {
  const { params } = props;
  const { workspace_slug, project_id } = params;
  // states
  const [error, setError] = useState(false);
  // params
  const searchParams = useSearchParams();
  const board = searchParams.get("board") || undefined;
  const peekId = searchParams.get("peekId") || undefined;

  useEffect(() => {
    if (!workspace_slug || !project_id) return;
    publishService
      .fetchAnchorFromOldDetails(workspace_slug, project_id)
      .then((res) => {
        let url = `/${res.anchor}`;
        const params = new URLSearchParams();
        if (board) params.append("board", board);
        if (peekId) params.append("peekId", peekId);
        if (params.toString()) url += `?${params.toString()}`;
        navigate(url);
      })
      .catch(() => setError(true));
  }, [board, peekId, project_id, workspace_slug]);

  if (error) notFound();

  return <LogoSpinner />;
};

export default ProjectIssuesPage;
