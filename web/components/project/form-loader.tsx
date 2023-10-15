import { FC } from "react";
// components
import { Loader } from "@plane/ui";

export interface IProjectDetailsFormLoader {}

export const ProjectDetailsFormLoader: FC<IProjectDetailsFormLoader> = () => (
  <>
    <div className="relative h-44 w-full mt-6">
      <Loader>
        <Loader.Item height="auto" width="46px" />
      </Loader>
      <div className="flex items-end justify-between gap-3 absolute bottom-4 w-full px-4">
        <div className="flex gap-3 flex-grow truncate">
          <div className="flex items-center justify-center flex-shrink-0 bg-custom-background-90 h-[52px] w-[52px] rounded-lg">
            <Loader>
              <Loader.Item height="46px" width="46px" />
            </Loader>
          </div>
        </div>
        <div className="flex justify-center flex-shrink-0">
          <Loader>
            <Loader.Item height="32px" width="108px" />
          </Loader>
        </div>
      </div>
    </div>
    <div className="flex flex-col gap-8 my-8">
      <div className="flex flex-col gap-1">
        <h4 className="text-sm">Project Name</h4>
        <Loader>
          <Loader.Item height="46px" width="100%" />
        </Loader>
      </div>
      <div className="flex flex-col gap-1">
        <h4 className="text-sm">Description</h4>
        <Loader className="w-full">
          <Loader.Item height="102px" width="full" />
        </Loader>
      </div>
      <div className="flex items-center justify-between gap-10 w-full">
        <div className="flex flex-col gap-1 w-1/2">
          <h4 className="text-sm">Identifier</h4>
          <Loader>
            <Loader.Item height="36px" width="100%" />
          </Loader>
        </div>
        <div className="flex flex-col gap-1 w-1/2">
          <h4 className="text-sm">Network</h4>
          <Loader className="w-full">
            <Loader.Item height="46px" width="100%" />
          </Loader>
        </div>
      </div>
      <div className="flex items-center justify-between py-2">
        <Loader className="mt-2 w-full">
          <Loader.Item height="34px" width="100px" />
        </Loader>
      </div>
    </div>
  </>
);
