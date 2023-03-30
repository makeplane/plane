import React from "react";

import { useRouter } from "next/router";

import useSWR from "swr";

// services
import pagesService from "services/pages.service";
// components
import { PagesView } from "components/pages";
// ui
import { Loader } from "components/ui";
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

  return (
    <>
      {pages ? (
        Object.keys(pages).length > 0 ? (
          <div className="mt-4 space-y-4">
            {Object.keys(pages).map((key) => {
              if (pages[key].length === 0) return null;

              return (
                <React.Fragment key={key}>
                  <h2 className="text-xl font-medium capitalize">
                    {replaceUnderscoreIfSnakeCase(key)}
                  </h2>
                  <PagesView pages={pages[key as keyof RecentPagesResponse]} viewType={viewType} />
                </React.Fragment>
              );
            })}
          </div>
        ) : (
          <p className="mt-4 text-center">No issues found</p>
        )
      ) : (
        <Loader className="mt-8 space-y-4">
          <Loader.Item height="40px" />
          <Loader.Item height="40px" />
          <Loader.Item height="40px" />
        </Loader>
      )}
    </>
  );
};
