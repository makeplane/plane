"use client";

import { useEffect } from "react";
import { useParams, useSearchParams, redirect, notFound } from "next/navigation";
// plane imports
import { SitesProjectPublishService } from "@plane/services";
import type { TProjectPublishSettings } from "@plane/types";
// components
import { LogoSpinner } from "@/components/common/logo-spinner";

const publishService = new SitesProjectPublishService();

export default function IssuesPage() {
  const params = useParams<{ workspaceSlug: string; projectId: string }>();
  const searchParams = useSearchParams();
  const { workspaceSlug, projectId } = params;
  const board = searchParams.get("board");
  const peekId = searchParams.get("peekId");

  useEffect(() => {
    const fetchAndRedirect = async () => {
      let response: TProjectPublishSettings | undefined = undefined;
      try {
        response = await publishService.retrieveSettingsByProjectId(workspaceSlug, projectId);
      } catch (error) {
        console.error("Error fetching project publish settings:", error);
        notFound();
      }

      let url = "";
      if (response?.entity_name === "project") {
        url = `/issues/${response?.anchor}`;
        const urlParams = new URLSearchParams();
        if (board) urlParams.append("board", String(board));
        if (peekId) urlParams.append("peekId", String(peekId));
        if (urlParams.toString()) url += `?${urlParams.toString()}`;
        redirect(url);
      } else {
        notFound();
      }
    };

    fetchAndRedirect();
  }, [workspaceSlug, projectId, board, peekId]);

  return (
    <div className="flex h-screen min-h-[500px] w-full justify-center items-center">
      <LogoSpinner />
    </div>
  );
}
