import { FC } from "react";
import { observer } from "mobx-react-lite";
// hooks
import { usePage } from "hooks/store";
// components
import { PagesListView } from "components/pages/pages-list";
// ui
import { Loader } from "@plane/ui";

export const AllPagesList: FC = observer(() => {
  // store
  const { projectPageIds } = usePage();

  if (!projectPageIds)
    return (
      <Loader className="space-y-4">
        <Loader.Item height="40px" />
        <Loader.Item height="40px" />
        <Loader.Item height="40px" />
      </Loader>
    );

  return <PagesListView pageIds={projectPageIds} />;
});
