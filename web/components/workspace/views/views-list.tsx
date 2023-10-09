import { observer } from "mobx-react-lite";

// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// components
import { GlobalViewListItem } from "components/workspace";
// ui
import { Loader } from "components/ui";

export const GlobalViewsList: React.FC = observer(() => {
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

  return (
    <>
      {viewsList.map((view) => (
        <GlobalViewListItem key={view.id} view={view} />
      ))}
    </>
  );
});
