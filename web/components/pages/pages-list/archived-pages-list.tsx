import { FC } from "react";
import { observer } from "mobx-react-lite";
// components
import { PagesListView } from "components/pages/pages-list";
// hooks
// ui
import { Loader, Spinner } from "@plane/ui";
import { useProjectPages } from "hooks/store/use-project-specific-pages";

export const ArchivedPagesList: FC = observer(() => {
  const projectPageStore = useProjectPages();
  const { archivedPageIds, archivedPageLoader } = projectPageStore;

  if (archivedPageLoader) {
    return (
      <div className="flex items-center justify-center h-full w-full">
        <Spinner />
      </div>
    );
  }
  if (!archivedPageIds)
    return (
      <Loader className="space-y-4">
        <Loader.Item height="40px" />
        <Loader.Item height="40px" />
        <Loader.Item height="40px" />
      </Loader>
    );

  return <PagesListView pageIds={archivedPageIds} />;
});
