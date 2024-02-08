import { FC } from "react";

type TViewDisplayFiltersRoot = {
  workspaceSlug: string;
  projectId: string | undefined;
  viewId: string;
};

export const ViewDisplayFiltersRoot: FC<TViewDisplayFiltersRoot> = (props) => {
  const { workspaceSlug, projectId, viewId } = props;

  return (
    <div>
      <div>ViewDisplayFiltersRoot</div>
    </div>
  );
};
