import { FC } from "react";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
import { Plus } from "lucide-react";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// components
import { EmptyState } from "components/common";
import { PagesListItem } from "./list-item";
// ui
import { Loader } from "@plane/ui";
// images
import emptyPage from "public/empty-state/page.svg";
// types
import { IPage } from "types";

type IPagesListView = {
  pages: IPage[];
};

export const PagesListView: FC<IPagesListView> = observer(({ pages }) => {
  // store
  const { commandPalette: commandPaletteStore } = useMobxStore();
  // router
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  return (
    <>
      {pages && workspaceSlug && projectId ? (
        <div className="space-y-4 h-full overflow-y-auto">
          {pages.length > 0 ? (
            <ul role="list" className="divide-y divide-custom-border-200">
              {pages.map((page) => (
                <PagesListItem
                  key={page.id}
                  workspaceSlug={workspaceSlug.toString()}
                  projectId={projectId.toString()}
                  page={page}
                />
              ))}
            </ul>
          ) : (
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
          )}
        </div>
      ) : (
        <Loader className="space-y-4">
          <Loader.Item height="40px" />
          <Loader.Item height="40px" />
          <Loader.Item height="40px" />
        </Loader>
      )}
    </>
  );
});
