import { observer } from "mobx-react";
// plane types
import type { IProjectView } from "@plane/types";
import { Spinner } from "@plane/ui";
// components
import type { TPowerKContext } from "@/components/power-k/core/types";
// hooks
import { PowerKViewsMenu } from "@/components/power-k/menus/views";
import { useProjectView } from "@/hooks/store/use-project-view";

type Props = {
  context: TPowerKContext;
  handleSelect: (view: IProjectView) => void;
};

export const PowerKOpenProjectViewsMenu = observer(function PowerKOpenProjectViewsMenu(props: Props) {
  const { context, handleSelect } = props;
  // store hooks
  const { fetchedMap, getProjectViews } = useProjectView();
  // derived values
  const projectId = context.params.projectId?.toString();
  const isFetched = projectId ? fetchedMap[projectId] : false;
  const viewsList = projectId ? (getProjectViews(projectId)?.filter((view) => !!view) ?? []) : [];

  if (!isFetched) return <Spinner />;

  return <PowerKViewsMenu views={viewsList} onSelect={handleSelect} />;
});
