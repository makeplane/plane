import React from "react";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
import useSWR from "swr";
import { Plus } from "lucide-react";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// services
import { PageService } from "services/page.service";
// components
import { PagesView } from "components/pages";
import { EmptyState } from "components/common";
// ui
import { Loader } from "@plane/ui";
// assets
import emptyPage from "public/empty-state/page.svg";
// helpers
import { replaceUnderscoreIfSnakeCase } from "helpers/string.helper";
// types
import { TPagesListProps } from "./types";
import { RecentPagesResponse } from "types";
// fetch-keys
import { RECENT_PAGES_LIST } from "constants/fetch-keys";

// services
const pageService = new PageService();

export const RecentPagesList: React.FC<TPagesListProps> = observer((props) => {
  const { viewType } = props;

  const { commandPalette: commandPaletteStore } = useMobxStore();

  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const { data: pages } = useSWR(
    workspaceSlug && projectId ? RECENT_PAGES_LIST(projectId as string) : null,
    workspaceSlug && projectId ? () => pageService.getRecentPages(workspaceSlug as string, projectId as string) : null
  );

  const isEmpty = pages && Object.keys(pages).every((key) => pages[key].length === 0);

  return (
    <>
      {pages ? (
        Object.keys(pages).length > 0 && !isEmpty ? (
          Object.keys(pages).map((key) => {
            if (pages[key].length === 0) return null;

            return (
              <div key={key} className="h-full overflow-hidden pb-9">
                <h2 className="text-xl font-semibold capitalize mb-2">{replaceUnderscoreIfSnakeCase(key)}</h2>
                <PagesView pages={pages[key as keyof RecentPagesResponse]} viewType={viewType} />
              </div>
            );
          })
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
});
