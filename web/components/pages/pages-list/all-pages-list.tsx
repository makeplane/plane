import { FC } from "react";
import { observer } from "mobx-react-lite";
// hooks
import { PagesListView } from "components/pages/pages-list";
// ui
import { Loader } from "@plane/ui";
import { useRouter } from "next/router";
import { useProjectSpecificPages } from "hooks/store/use-project-specific-pages";
import { trace } from "mobx";

export const AllPagesList: FC = observer(() => {
  trace(true);
  const router = useRouter();
  const { projectId } = router.query;
  // store
  const pageStores = useProjectSpecificPages(projectId as string);

  if (!pageStores)
    return (
      <Loader className="space-y-4">
        <Loader.Item height="40px" />
        <Loader.Item height="40px" />
        <Loader.Item height="40px" />
      </Loader>
    );
  return <PagesListView />;
});
