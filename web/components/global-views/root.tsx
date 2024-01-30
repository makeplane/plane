import { FC } from "react";

type TGlobalViewsRootProps = {
  workspaceSlug: string;
  projectId: string;
  viewId: string;
};

export const GlobalViewsRoot: FC<TGlobalViewsRootProps> = (props) => {
  const { viewId } = props;

  return <div>GlobalViewsRoot {viewId}</div>;
};
