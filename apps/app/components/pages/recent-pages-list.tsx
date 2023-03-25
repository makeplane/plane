import React from "react";

// components
import { PagesView } from "components/pages";
// ui
import { Loader } from "components/ui";
// helpers
import { replaceUnderscoreIfSnakeCase } from "helpers/string.helper";
// types
import { RecentPagesResponse, TPageViewProps } from "types";

type Props = {
  pages: RecentPagesResponse | undefined;
  viewType: TPageViewProps;
};

export const RecentPagesList: React.FC<Props> = ({ pages, viewType }) => (
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
