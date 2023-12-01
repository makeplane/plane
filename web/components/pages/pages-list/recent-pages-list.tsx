import React, { FC } from "react";
import { observer } from "mobx-react-lite";
import { Plus } from "lucide-react";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// components
import { PagesListView } from "components/pages/pages-list";
import { EmptyState } from "components/common";
// ui
import { Loader } from "@plane/ui";
// assets
import emptyPage from "public/empty-state/page.svg";
// helpers
import { replaceUnderscoreIfSnakeCase } from "helpers/string.helper";

export const RecentPagesList: FC = observer(() => {
  // store
  const {
    commandPalette: commandPaletteStore,
    page: { recentProjectPages },
  } = useMobxStore();

  const isEmpty = recentProjectPages && Object.values(recentProjectPages).every((value) => value.length === 0);

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
                <h2 className="sticky top-0 bg-custom-background-100 z-[1] text-xl font-semibold capitalize mb-2">
                  {replaceUnderscoreIfSnakeCase(key)}
                </h2>
                <PagesListView pages={recentProjectPages[key]} />
              </div>
            );
          })}
        </>
      ) : (
        <>
          <EmptyState
            title="Have your thoughts in place"
            description="You can think of Pages as an AI-powered notepad."
            image={emptyPage}
            primaryButton={{
              icon: <Plus className="h-4 w-4" />,
              text: "New Page",
              onClick: () => commandPaletteStore.toggleCreatePageModal(true),
            }}
          />
        </>
      )}
    </>
  );
});
