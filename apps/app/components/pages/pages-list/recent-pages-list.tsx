import React from "react";

import { useRouter } from "next/router";

import useSWR from "swr";

// services
import pagesService from "services/pages.service";
// components
import { PagesView } from "components/pages";
// ui
import { EmptyState, Loader } from "components/ui";
// images
import emptyPage from "public/empty-state/empty-page.svg";
// helpers
import { replaceUnderscoreIfSnakeCase } from "helpers/string.helper";
// types
import { TPagesListProps } from "./types";
import { RecentPagesResponse } from "types";
// fetch-keys
import { RECENT_PAGES_LIST } from "constants/fetch-keys";

export const RecentPagesList: React.FC<TPagesListProps> = ({ viewType }) => {
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const { data: pages } = useSWR(
    workspaceSlug && projectId ? RECENT_PAGES_LIST(projectId as string) : null,
    workspaceSlug && projectId
      ? () => pagesService.getRecentPages(workspaceSlug as string, projectId as string)
      : null
  );

  const isEmpty = pages && Object.keys(pages).every((key) => pages[key].length === 0);

  return (
    <>
      {pages ? (
        Object.keys(pages).length > 0 && !isEmpty ? (
          Object.keys(pages).map((key) => {
            if (pages[key].length === 0) return null;

            return (
              <div key={key}>
                <h2 className="text-xl font-semibold capitalize mb-2">
                  {replaceUnderscoreIfSnakeCase(key)}
                </h2>
                <PagesView pages={pages[key as keyof RecentPagesResponse]} viewType={viewType} />
              </div>
            );
          })
        ) : (
          <EmptyState
            type="page"
            title="Create New Page"
            description="Create and document issues effortlessly in one place with Plane Notes, AI-powered for ease."
            imgURL={emptyPage}
          />
        )
      ) : (
        <Loader className="space-y-4">
          <Loader.Item height="40px" />
          <Loader.Item height="40px" />
          <Loader.Item height="40px" />
        </Loader>
      )}
    </>
  );
};
