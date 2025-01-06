"use client";

import React from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { useTheme } from "next-themes";
import useSWR from "swr";
// ui
import { Loader } from "@plane/ui";
// components
import { EmptyState } from "@/components/common";
import { PageHead } from "@/components/core";
// hooks
import { useAppRouter } from "@/hooks/use-app-router";
// Plane-web
import { InitiativeDetailRoot } from "@/plane-web/components/initiatives/detail/root";
import { useInitiatives } from "@/plane-web/hooks/store/use-initiatives";
// public
import emptyIssueDark from "@/public/empty-state/search/issues-dark.webp";
import emptyIssueLight from "@/public/empty-state/search/issues-light.webp";

const IssueDetailsPage = observer(() => {
  // router
  const router = useAppRouter();
  const { workspaceSlug, initiativeId } = useParams();
  // hooks
  const { resolvedTheme } = useTheme();
  // store hooks
  const {
    initiative: { getInitiativeById, fetchInitiativeDetails },
  } = useInitiatives();
  // fetching issue details
  const { isLoading, error } = useSWR(
    workspaceSlug && initiativeId ? `INITIATIVE_DETAIL_${workspaceSlug}_${initiativeId}` : null,
    workspaceSlug && initiativeId
      ? () => fetchInitiativeDetails(workspaceSlug.toString(), initiativeId.toString())
      : null
  );

  // derived values
  const initiativeDetails = getInitiativeById(initiativeId.toString());
  const loader = !initiativeDetails || isLoading;
  const pageTitle = initiativeDetails ? `Initiative - ${initiativeDetails.name}` : "Initiative";

  return (
    <>
      <PageHead title={pageTitle} />
      {error ? (
        <EmptyState
          image={resolvedTheme === "dark" ? emptyIssueDark : emptyIssueLight}
          title="Initiative does not exist"
          description="The Initiative you are looking for does not exist or has been deleted."
          primaryButton={{
            text: "View other Initiatives",
            onClick: () => router.push(`/${workspaceSlug}/initiatives`),
          }}
        />
      ) : loader ? (
        <Loader className="flex h-full gap-5 p-5">
          <div className="basis-2/3 space-y-2">
            <Loader.Item height="30px" width="40%" />
            <Loader.Item height="15px" width="60%" />
            <Loader.Item height="15px" width="60%" />
            <Loader.Item height="15px" width="40%" />
          </div>
          <div className="basis-1/3 space-y-3">
            <Loader.Item height="30px" />
            <Loader.Item height="30px" />
            <Loader.Item height="30px" />
            <Loader.Item height="30px" />
          </div>
        </Loader>
      ) : (
        workspaceSlug &&
        initiativeDetails && (
          <InitiativeDetailRoot workspaceSlug={workspaceSlug.toString()} initiativeId={initiativeId.toString()} />
        )
      )}
    </>
  );
});

export default IssueDetailsPage;
