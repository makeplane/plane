import { FC } from "react";

type TViewFiltersItem = {
  workspaceSlug: string;
  projectId: string | undefined;
  viewId: string | undefined;
};

export const ViewFiltersItem: FC<TViewFiltersItem> = (props) => {
  const { workspaceSlug, projectId, viewId } = props;

  return (
    <div>
      <div>ViewFiltersItem</div>
    </div>
  );
};
