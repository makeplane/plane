import { FC } from "react";
// components
import { PagesListView } from "components/pages/pages-list";
// hooks
import { useMobxStore } from "lib/mobx/store-provider";
// ui
import { Loader } from "@plane/ui";

export const FavoritePagesList: FC = () => {
  const {
    page: { favoritePages },
  } = useMobxStore();

  if (!favoritePages) {
    return (
      <Loader className="space-y-4">
        <Loader.Item height="40px" />
        <Loader.Item height="40px" />
        <Loader.Item height="40px" />
      </Loader>
    );
  }

  return <PagesListView pages={favoritePages} />;
};
