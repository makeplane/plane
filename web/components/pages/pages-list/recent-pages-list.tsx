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
import { PAGE_EMPTY_STATE_DETAILS } from "constants/empty-state";

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
            title={PAGE_EMPTY_STATE_DETAILS["Recent"].title}
            description={PAGE_EMPTY_STATE_DETAILS["Recent"].description}
            image={EmptyStateImagePath}
            primaryButton={{
              text: PAGE_EMPTY_STATE_DETAILS["Recent"].primaryButton.text,
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
