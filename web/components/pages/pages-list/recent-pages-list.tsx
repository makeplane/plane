import React, { FC } from "react";
import { observer } from "mobx-react-lite";
// hooks
import { Loader } from "@plane/ui";
import { EmptyState } from "@/components/empty-state";
import { PagesListView } from "@/components/pages/pages-list";
import { EmptyStateType } from "@/constants/empty-state";
import { replaceUnderscoreIfSnakeCase } from "@/helpers/string.helper";
import { useApplication } from "@/hooks/store";
import { useProjectPages } from "@/hooks/store/use-project-specific-pages";
// components
// ui
// helpers
// constants

export const RecentPagesList: FC = observer(() => {
  // store hooks
  const { commandPalette: commandPaletteStore } = useApplication();

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
                <h2 className="sticky top-0 z-[1] mb-2 bg-custom-background-100 text-xl font-semibold capitalize px-3 md:p-0">
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
            primaryButtonOnClick={() => commandPaletteStore.toggleCreatePageModal(true)}
            size="sm"
          />
        </>
      )}
    </>
  );
});
