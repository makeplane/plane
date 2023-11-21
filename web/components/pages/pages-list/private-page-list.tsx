import { FC } from "react";
import { observer } from "mobx-react-lite";
// components
import { PagesListView } from "components/pages/pages-list";
// hooks
import { useMobxStore } from "lib/mobx/store-provider";
// ui
import { Loader } from "@plane/ui";

export const PrivatePagesList: FC = observer(() => {
  const {
    page: { privateProjectPages },
  } = useMobxStore();

  if (!privateProjectPages)
    return (
      <Loader className="space-y-4">
        <Loader.Item height="40px" />
        <Loader.Item height="40px" />
        <Loader.Item height="40px" />
      </Loader>
    );

  return <PagesListView pages={privateProjectPages} />;
});
