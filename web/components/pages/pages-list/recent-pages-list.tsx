import React, { FC } from "react";
import { observer } from "mobx-react-lite";
import { Plus } from "lucide-react";
// hooks
import { useApplication, useUser } from "hooks/store";
// components
import { PagesListView } from "components/pages/pages-list";
import { NewEmptyState } from "components/common/new-empty-state";
// ui
import { Loader } from "@plane/ui";
// assets
import emptyPage from "public/empty-state/empty_page.png";
// helpers
import { replaceUnderscoreIfSnakeCase } from "helpers/string.helper";
// constants
import { EUserProjectRoles } from "constants/project";
import { useProjectPages } from "hooks/store/use-project-specific-pages";

export const RecentPagesList: FC = observer(() => {
  // store hooks
  const { commandPalette: commandPaletteStore } = useApplication();
  const {
    membership: { currentProjectRole },
  } = useUser();
  const { recentProjectPages } = useProjectPages();

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
          <NewEmptyState
            title="Write a note, a doc, or a full knowledge base. Get Galileo, Plane’s AI assistant, to help you get started."
            description="Pages are thoughtspotting space in Plane. Take down meeting notes, format them easily, embed issues, lay them out using a library of components, and keep them all in your project’s context. To make short work of any doc, invoke Galileo, Plane’s AI, with a shortcut or the click of a button."
            image={emptyPage}
            comicBox={{
              title: "A page can be a doc or a doc of docs.",
              description:
                "We wrote Parth and Meera’s love story. You could write your project’s mission, goals, and eventual vision.",
              direction: "right",
            }}
            primaryButton={{
              icon: <Plus className="h-4 w-4" />,
              text: "Create your first page",
              onClick: () => commandPaletteStore.toggleCreatePageModal(true),
            }}
            disabled={!isEditingAllowed}
          />
        </>
      )}
    </>
  );
});
