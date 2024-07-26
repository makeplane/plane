"use client";

import { useState } from "react";
// components
import { Button } from "@plane/ui";
import { CollaboratorsList } from "./collaborators-list";
// ui

type Props = {
  dashboardId: string;
  perPage: number;
  workspaceSlug: string;
};

export const DefaultCollaboratorsList: React.FC<Props> = (props) => {
  const { dashboardId, perPage, workspaceSlug } = props;
  // states
  const [pageCount, setPageCount] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [resultsCount, setResultsCount] = useState(0);

  const handleLoadMore = () => setPageCount((prev) => prev + 1);

  const updateTotalPages = (count: number) => setTotalPages(count);

  const updateResultsCount = (count: number) => setResultsCount(count);

  const collaboratorsPages: JSX.Element[] = [];
  for (let i = 0; i < pageCount; i++)
    collaboratorsPages.push(
      <CollaboratorsList
        key={i}
        dashboardId={dashboardId}
        cursor={`${perPage}:${i}:0`}
        perPage={perPage}
        updateResultsCount={updateResultsCount}
        updateTotalPages={updateTotalPages}
        workspaceSlug={workspaceSlug}
      />
    );

  const showViewMoreButton = pageCount < totalPages && resultsCount !== 0;
  const showViewLessButton = pageCount > 1;

  return (
    <>
      <div className="mt-7 mb-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 xl:grid-cols-8 gap-2 gap-y-8">
        {collaboratorsPages}
      </div>
      {(showViewLessButton || showViewMoreButton) && (
        <div className="flex items-center justify-center text-xs w-full">
          {showViewLessButton && (
            <Button
              variant="link-primary"
              size="sm"
              className="my-3 hover:bg-custom-primary-100/20"
              onClick={() => setPageCount(1)}
            >
              View less
            </Button>
          )}
          {showViewMoreButton && (
            <Button
              variant="link-primary"
              size="sm"
              className="my-3 hover:bg-custom-primary-100/20"
              onClick={handleLoadMore}
            >
              View more
            </Button>
          )}
        </div>
      )}
    </>
  );
};
