import { FC } from "react";
import { observer } from "mobx-react-lite";
// components
import { PagesListView } from "components/pages/pages-list";
// hooks
// ui
import { Loader } from "@plane/ui";
import { useProjectPages } from "hooks/store/use-project-specific-pages";

export const FavoritePagesList: FC = observer(() => {
  const projectPageStore = useProjectPages();
  const { favoriteProjectPageIds } = projectPageStore;

  if (!favoriteProjectPageIds)
    return (
      <Loader className="space-y-4">
        <Loader.Item height="40px" />
        <Loader.Item height="40px" />
        <Loader.Item height="40px" />
      </Loader>
    );

  return <PagesListView pageIds={favoriteProjectPageIds} />;
});
