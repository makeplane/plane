import { observer } from "mobx-react-lite";

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
  const { searchQuery } = props;

  const { globalViews: globalViewsStore } = useMobxStore();

  const viewsList = globalViewsStore.globalViewsList;

  if (!viewsList)
    return (
      <Loader className="space-y-1.5">
        <Loader.Item height="72px" />
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
