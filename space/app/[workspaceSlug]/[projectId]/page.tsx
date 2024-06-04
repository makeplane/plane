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
    workspaceSlug: string;
    projectId: string;
  };
};

const ProjectIssuesPage = (props: Props) => {
  const { params } = props;
  const { workspaceSlug, projectId } = params;
  // states
  const [error, setError] = useState(false);
  // params
  const searchParams = useSearchParams();
  const board = searchParams.get("board") || undefined;
  const peekId = searchParams.get("peekId") || undefined;

  useEffect(() => {
    if (!workspaceSlug || !projectId) return;
    publishService
      .fetchAnchorFromProjectDetails(workspaceSlug, projectId)
      .then((res) => {
        let url = "";
        if (res.entity_name === "project") {
          url = `/issues/${res.anchor}`;
          const params = new URLSearchParams();
          if (board) params.append("board", board);
          if (peekId) params.append("peekId", peekId);
          if (params.toString()) url += `?${params.toString()}`;
          navigate(url);
        } else throw Error("Invalid entity name");
      })
      .catch(() => setError(true));
  }, [board, peekId, projectId, workspaceSlug]);

  if (error) notFound();

  return <LogoSpinner />;
};

export default ProjectIssuesPage;
