"use client";

// components
// ui
import { IUserPriorityDistribution } from "@plane/types";
import { Loader } from "@plane/ui";
// types
import { PriorityDistributionContent } from "./main-content";

type Props = {
  priorityDistribution: IUserPriorityDistribution[] | undefined;
};

export const ProfilePriorityDistribution: React.FC<Props> = (props) => {
  const { priorityDistribution } = props;

  return (
    <div className="flex flex-col space-y-2">
      <h3 className="text-lg font-medium">Issues by priority</h3>
      {priorityDistribution ? (
        <PriorityDistributionContent priorityDistribution={priorityDistribution} />
      ) : (
        <div className="grid place-items-center p-7">
          <Loader className="flex items-end gap-12">
            <Loader.Item width="30px" height="200px" />
            <Loader.Item width="30px" height="150px" />
            <Loader.Item width="30px" height="250px" />
            <Loader.Item width="30px" height="150px" />
            <Loader.Item width="30px" height="100px" />
          </Loader>
        </div>
      )}
    </div>
  );
};
