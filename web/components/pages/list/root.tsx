import { FC } from "react";
// components
import { PageListBlock } from "./";

type TPagesListRoot = {
  workspaceSlug: string;
  projectId: string;
};

export const PagesListRoot: FC<TPagesListRoot> = (props) => {
  const { workspaceSlug, projectId } = props;

  console.log("workspaceSlug", workspaceSlug);
  console.log("projectId", projectId);

  return (
    <div className="relative w-full h-full overflow-hidden overflow-y-auto divide-y-[0.5px] divide-custom-border-200">
      <PageListBlock />
    </div>
  );
};
