"use client";

import { useEffect } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// hooks
import { useInitiatives } from "@/plane-web/hooks/store/use-initiatives";
// local components
import { InitiativesRoot } from "../components/initiatives-root";
import { InitiativeAppliedFiltersRoot } from "../header/filters";

export const InitiativesPageRoot = observer(() => {
  // router
  const { workspaceSlug } = useParams();
  // store hooks
  const { initiative, initiativeFilters } = useInitiatives();

  useEffect(() => {
    if (workspaceSlug) {
      initiativeFilters.initInitiativeFilters(workspaceSlug.toString());
      initiative.fetchInitiatives(workspaceSlug.toString());
    }
  }, [workspaceSlug, initiative, initiativeFilters]);

  if (!workspaceSlug) return <></>;

  return (
    <div className="h-full w-full flex flex-col">
      <InitiativeAppliedFiltersRoot />
      <InitiativesRoot />
    </div>
  );
});
