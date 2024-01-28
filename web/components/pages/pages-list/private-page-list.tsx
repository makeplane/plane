import { FC } from "react";
import { observer } from "mobx-react-lite";
// hooks
// components
import { PagesListView } from "components/pages/pages-list";
// ui
import { Loader } from "@plane/ui";
import { useProjectPages } from "hooks/store/use-project-specific-pages";

export const PrivatePagesList: FC = observer(() => {
  const projectPageStore = useProjectPages();
  const { privateProjectPageIds } = projectPageStore;

  if (!privateProjectPageIds)
    return (
      <Loader className="space-y-4">
        <Loader.Item height="40px" />
        <Loader.Item height="40px" />
        <Loader.Item height="40px" />
      </Loader>
    );

  return <PagesListView pageIds={privateProjectPageIds} />;
});
