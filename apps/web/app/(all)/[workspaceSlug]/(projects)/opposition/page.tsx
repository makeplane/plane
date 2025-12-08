"use client";
import React from "react";
import { useParams } from "next/navigation";
import { PageHead } from "@/components/core/page-title";

import { useOppositionSearch } from "./(context)/opposition-search-context";
import { useOppositionTeams } from "./(context)/opposition-teams-context";
// import { loadOppositionTeams } from "./(opposition-api)/loadOppositionTeams";
import OppositionTeamsList from "./opposition-list";

const WorkspaceOppositionPage = () => {
  const { workspaceSlug: routeWorkspaceSlug } = useParams();
  const { search } = useOppositionSearch();
  const pageTitle = "Opposition Teams";
   const { teams, loading } = useOppositionTeams();

  // const [teams, setTeams] = useState([]);


  // derived values
  const workspaceSlug = (routeWorkspaceSlug as string) || undefined;

  if (!workspaceSlug) return null;

  return (
    <>
      <PageHead title={pageTitle} />
      <div className="relative h-full w-full overflow-hidden overflow-y-auto">
        <OppositionTeamsList teams={teams} workspaceSlug={workspaceSlug} searchQuery={search} />
      </div>
    </>
  );
};

export default WorkspaceOppositionPage;
