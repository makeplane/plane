import { FC } from "react";
import { observer } from "mobx-react-lite";
// hooks
import { usePage } from "hooks/store";
// components
import { PagesListView } from "components/pages/pages-list";
// ui
import { Loader } from "@plane/ui";

export const PrivatePagesList: FC = observer(() => {
  const { privateProjectPages } = usePage();

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
