import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
import useSWR from "swr";

// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// components
import { GlobalViewListItem } from "components/workspace";
// ui
import { Loader } from "@plane/ui";

type Props = {
  searchQuery: string;
};

export const GlobalViewsList: React.FC<Props> = observer((props) => {
  const router = useRouter();
  const { workspaceSlug } = router.query;

  const { searchQuery } = props;

  const { globalViews: globalViewsStore } = useMobxStore();

  useSWR(
    workspaceSlug ? `GLOBAL_VIEWS_LIST_${workspaceSlug.toString()}` : null,
    workspaceSlug ? () => globalViewsStore.fetchAllGlobalViews(workspaceSlug.toString()) : null
  );

  const viewsList = globalViewsStore.globalViewsList;

  if (!viewsList)
    return (
      <Loader className="space-y-4 p-4">
        <Loader.Item height="72px" />
        <Loader.Item height="72px" />
        <Loader.Item height="72px" />
        <Loader.Item height="72px" />
      </Loader>
    );

  const filteredViewsList = viewsList.filter((v) => v.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <>
      {filteredViewsList.map((view) => (
        <GlobalViewListItem key={view.id} view={view} />
      ))}
    </>
  );
});
