"use client";
import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { PageHead } from "@/components/core/page-title";

import { loadOppositionTeams } from "./(opposition-api)/loadOppositionTeams";
import OppositionTeamsList from "./opposition-list";
import { useOppositionSearch } from "./opposition-search-context";

const WorkspaceOppositionPage = () => {
  const { workspaceSlug: routeWorkspaceSlug } = useParams();
  const { search } = useOppositionSearch();
  const pageTitle = "Opposition Teams";

  const [teams, setTeams] = useState([]);

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const data = await loadOppositionTeams();
        console.log("Opposition Teams:", data);
        setTeams(data);
      } catch (err) {
        console.error("Failed to load opposition teams:", err);
      }
    };

    fetchTeams();
  }, []);

   // derived values
  const workspaceSlug = (routeWorkspaceSlug as string) || undefined;

  if (!workspaceSlug) return null;

  return (
    <>
      <PageHead title={pageTitle} />

      <div className="relative h-full w-full overflow-hidden overflow-y-auto">
        <OppositionTeamsList teams={teams}  workspaceSlug={workspaceSlug} searchQuery={search} />
      </div>
    </>
  );
};

export default WorkspaceOppositionPage;
