import { FC } from "react";
import { observer } from "mobx-react-lite";
// components
import { PagesListView } from "components/pages/pages-list";
// hooks
import { usePage } from "hooks/store";
// ui
import { Loader } from "@plane/ui";

export const SharedPagesList: FC = observer(() => {
  const { publicProjectPageIds } = usePage();

  if (!publicProjectPageIds)
    return (
      <Loader className="space-y-4">
        <Loader.Item height="40px" />
        <Loader.Item height="40px" />
        <Loader.Item height="40px" />
      </Loader>
    );

  return <PagesListView pageIds={publicProjectPageIds} />;
});
