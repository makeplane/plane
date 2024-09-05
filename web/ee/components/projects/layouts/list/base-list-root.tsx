import { useMemo } from "react";
import { observer } from "mobx-react";
// hooks
import { useProjectFilter } from "@/plane-web/hooks/store";
import { EProjectLayouts } from "@/plane-web/types/workspace-project-filters";
import { ProjectLayoutHOC } from "../project-layout-HOC";
import { List } from "./default";

export const BaseListRoot = observer(() => {
  // store hooks
  const { getFilteredProjectsByLayout } = useProjectFilter();

  const groupByProjectIds = getFilteredProjectsByLayout(EProjectLayouts.BOARD);
  // auth
  const displayProperties = useMemo(
    () => ({
      key: true,
      state: true,
      labels: true,
      priority: true,
      due_date: true,
    }),
    []
  );
  return (
    <ProjectLayoutHOC layout={EProjectLayouts.TABLE}>
      <div className={`relative size-full bg-custom-background-90`}>
        <List
          displayProperties={displayProperties}
          groupBy={"state"}
          groupedProjectIds={groupByProjectIds ?? {}}
          showEmptyGroup
        />
      </div>
    </ProjectLayoutHOC>
  );
});
