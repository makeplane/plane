import { FC } from "react";
import { observer } from "mobx-react-lite";
// hooks
import { PagesListView } from "components/pages/pages-list";
// ui
import { Loader } from "@plane/ui";
import { useProjectPages } from "hooks/store/use-project-specific-pages";

export const AllPagesList: FC = observer(() => {
  const pageStores = useProjectPages();
  // subscribing to the projectPageStore
  const { projectPageIds } = pageStores;

  if (!projectPageIds) {
    return (
      <Loader className="space-y-4">
        <Loader.Item height="40px" />
        <Loader.Item height="40px" />
        <Loader.Item height="40px" />
      </Loader>
    );
  }
  return <PagesListView pageIds={projectPageIds} />;
});
