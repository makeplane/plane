"use client";

import { useEffect, useState } from "react";
import { notFound, useSearchParams, useRouter } from "next/navigation";
// components
import { LogoSpinner } from "@/components/common";
// services
import PublishService from "@/services/publish.service";
const publishService = new PublishService();

type Props = {
  params: {
    workspaceSlug: string;
    projectId: string;
  };
};

const IssuesPage = (props: Props) => {
  const { params } = props;
  const { workspaceSlug, projectId } = params;
  // states
  const [error, setError] = useState(false);
  // router
  const router = useRouter();
  // params
  const searchParams = useSearchParams();
  const board = searchParams.get("board");
  const peekId = searchParams.get("peekId");

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
          router.push(url);
          // navigate(url);
        } else throw Error("Invalid entity name");
      })
      .catch(() => setError(true));
  }, [board, peekId, projectId, router, workspaceSlug]);

  if (error) notFound();

  return <LogoSpinner />;
};

export default IssuesPage;
