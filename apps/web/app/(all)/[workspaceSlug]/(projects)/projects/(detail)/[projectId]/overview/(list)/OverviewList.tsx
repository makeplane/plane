import { observer } from "mobx-react";
import useSWR from "swr";
import { TPageNavigationTabs } from "@plane/types";
// plane web hooks
import { EPageStoreType, usePageStore } from "@/plane-web/hooks/store";
// local imports

type TPageView = {
  children: React.ReactNode;
  projectId: string;
  workspaceSlug: string;
};

export const OverviewListView: React.FC<TPageView> = observer((props) => {
  const { children, projectId, workspaceSlug } = props;
  // store hooks

  // pages loader
  return (
    <>
      <h1>hhhhh</h1>
    </>
  );
});
