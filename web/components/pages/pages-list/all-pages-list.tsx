import { FC } from "react";
import { observer } from "mobx-react-lite";
// components
import { PagesListView } from "components/pages/pages-list";
// fetch-keys
import { useMobxStore } from "lib/mobx/store-provider";
// ui
import { Loader } from "@plane/ui";

export const AllPagesList: FC = observer(() => {
  // store
  const {
    page: { projectPages },
  } = useMobxStore();

  if (!projectPages)
    return (
      <Loader className="space-y-4">
        <Loader.Item height="40px" />
        <Loader.Item height="40px" />
        <Loader.Item height="40px" />
      </Loader>
    );

  return <PagesListView pages={projectPages} />;
});
