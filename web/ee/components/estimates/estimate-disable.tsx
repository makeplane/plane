import { FC } from "react";
import { observer } from "mobx-react";

type TEstimateDisable = {
  workspaceSlug: string;
  projectId: string;
};

export const EstimateDisable: FC<TEstimateDisable> = observer((props) => {
  const { workspaceSlug, projectId } = props;
  // hooks

  return (
    <div>
      Estimate Disable {workspaceSlug} {projectId}
    </div>
  );
});
