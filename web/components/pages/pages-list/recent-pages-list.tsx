import React, { FC } from "react";
import { observer } from "mobx-react-lite";
import { useTheme } from "next-themes";
// hooks
import { useApplication, useUser } from "hooks/store";
import { useProjectPages } from "hooks/store/use-project-specific-pages";
// components
import { PagesListView } from "components/pages/pages-list";
import { EmptyState, getEmptyStateImagePath } from "components/empty-state";
// ui
import { Loader } from "@plane/ui";
// helpers
import { replaceUnderscoreIfSnakeCase } from "helpers/string.helper";
// constants
import { EUserProjectRoles } from "constants/project";

export const RecentPagesList: FC = observer(() => {
  // theme
  const { resolvedTheme } = useTheme();
  // store hooks
  const { commandPalette: commandPaletteStore } = useApplication();
  const {
    membership: { currentProjectRole },
    currentUser,
  } = useUser();
  const { recentProjectPages } = useProjectPages();

  const isLightMode = resolvedTheme ? resolvedTheme === "light" : currentUser?.theme.theme === "light";
  const EmptyStateImagePath = getEmptyStateImagePath("pages", "recent", isLightMode);

  // FIXME: replace any with proper type
  const isEmpty = recentProjectPages && Object.values(recentProjectPages).every((value: any) => value.length === 0);

  const isEditingAllowed = !!currentProjectRole && currentProjectRole >= EUserProjectRoles.MEMBER;

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
                <h2 className="sticky top-0 z-[1] mb-2 bg-custom-background-100 text-xl font-semibold capitalize">
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
            title="Write a note, a doc, or a full knowledge base"
            description="Pages help you organise your thoughts to create wikis, discussions or even document heated takes for your project. Use it wisely! Pages will be sorted and grouped by last updated."
            image={EmptyStateImagePath}
            primaryButton={{
              text: "Create new page",
              onClick: () => commandPaletteStore.toggleCreatePageModal(true),
            }}
            size="sm"
            disabled={!isEditingAllowed}
          />
        </>
      )}
    </>
  );
});
