"use client";

import { useState } from "react";
import Image from "next/image";
import { useTheme } from "next-themes";
// components
// ui
import { Button } from "@plane/ui";
// assets
import DarkImage from "@/public/empty-state/dashboard/dark/recent-collaborators-1.svg";
import LightImage from "@/public/empty-state/dashboard/light/recent-collaborators-1.svg";
import { CollaboratorsList } from "./collaborators-list";

type Props = {
  dashboardId: string;
  perPage: number;
  searchQuery: string;
  workspaceSlug: string;
};

export const SearchedCollaboratorsList: React.FC<Props> = (props) => {
  const { dashboardId, perPage, searchQuery, workspaceSlug } = props;
  // states
  const [pageCount, setPageCount] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [resultsCount, setResultsCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  // next-themes
  const { resolvedTheme } = useTheme();

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
        searchQuery={searchQuery}
        updateIsLoading={setIsLoading}
        updateResultsCount={updateResultsCount}
        updateTotalPages={updateTotalPages}
        workspaceSlug={workspaceSlug}
      />
    );

  const showViewMoreButton = pageCount < totalPages && resultsCount !== 0;
  const showViewLessButton = pageCount > 1;

  const emptyStateImage = resolvedTheme === "dark" ? DarkImage : LightImage;

  return (
    <>
      <div className="mt-7 mb-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 xl:grid-cols-8 gap-2 gap-y-8">
        {collaboratorsPages}
      </div>
      {!isLoading && totalPages === 0 && (
        <div className="flex flex-col items-center gap-6 mb-8">
          <div className="h-24 w-24 flex-shrink-0">
            <Image src={emptyStateImage} className="w-full h-full" alt="Recent collaborators" />
          </div>
          <p className="font-medium text-sm">No matching member</p>
        </div>
      )}
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
