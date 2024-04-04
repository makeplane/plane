import React, { FC } from "react";
import { observer } from "mobx-react";
// ui
import { Loader } from "@plane/ui";
// components
import { EmptyState } from "@/components/empty-state";
import { PagesListView } from "@/components/pages/pages-list";
// constants
import { EmptyStateType } from "@/constants/empty-state";
// helpers
import { replaceUnderscoreIfSnakeCase } from "@/helpers/string.helper";
// hooks
import { useCommandPalette } from "@/hooks/store";
import { useProjectPages } from "@/hooks/store/use-project-specific-pages";

export const RecentPagesList: FC = observer(() => {
  // store hooks
  const { toggleCreatePageModal } = useCommandPalette();
  const { recentProjectPages } = useProjectPages();

  // FIXME: replace any with proper type
  const isEmpty = recentProjectPages && Object.values(recentProjectPages).every((value: any) => value.length === 0);

  if (!recentProjectPages) {
    return (
      <Loader className="space-y-4">
        <Loader.Item height="40px" />
        <Loader.Item height="40px" />
        <Loader.Item height="40px" />
      </Loader>
    );
  }

  return (
    <>
      {Object.keys(recentProjectPages).length > 0 && !isEmpty ? (
        <>
          {Object.keys(recentProjectPages).map((key) => {
            if (recentProjectPages[key]?.length === 0) return null;

            return (
              <div key={key}>
                <h2 className="sticky top-0 z-[1] mb-2 bg-custom-background-100 px-3 text-xl font-semibold capitalize md:p-0">
                  {replaceUnderscoreIfSnakeCase(key)}
                </h2>
                <PagesListView pageIds={recentProjectPages[key]} />
              </div>
            );
          })}
        </>
      ) : (
        <>
          <EmptyState
            type={EmptyStateType.PROJECT_PAGE_RECENT}
            primaryButtonOnClick={() => toggleCreatePageModal(true)}
            size="sm"
          />
        </>
      )}
    </>
  );
});
