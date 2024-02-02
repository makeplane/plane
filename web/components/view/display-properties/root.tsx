import { FC } from "react";

type TViewDisplayPropertiesRoot = {
  workspaceSlug: string;
  projectId: string | undefined;
  viewId: string | undefined;
};

export const ViewDisplayPropertiesRoot: FC<TViewDisplayPropertiesRoot> = (props) => {
  const { workspaceSlug, projectId, viewId } = props;

  return (
    <div>
      <div>ViewDisplayPropertiesRoot</div>
    </div>
  );
};
