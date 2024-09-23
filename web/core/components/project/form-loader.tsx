"use client";

import { FC } from "react";
// components
import { Loader } from "@plane/ui";

export const ProjectDetailsFormLoader: FC = () => (
  <>
    <div className="relative mt-6 h-44 w-full">
      <Loader>
        <Loader.Item height="auto" width="46px" />
      </Loader>
      <div className="absolute bottom-4 flex w-full items-end justify-between gap-3 px-4">
        <div className="flex flex-grow gap-3 truncate">
          <div className="flex h-[52px] w-[52px] flex-shrink-0 items-center justify-center rounded-lg bg-custom-background-90">
            <Loader>
              <Loader.Item height="46px" width="46px" />
            </Loader>
          </div>
        </div>
        <div className="flex flex-shrink-0 justify-center">
          <Loader>
            <Loader.Item height="32px" width="108px" />
          </Loader>
        </div>
      </div>
    </div>
    <div className="my-8 flex flex-col gap-8">
      <div className="flex flex-col gap-1">
        <h4 className="text-sm">Project name</h4>
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
      <div className="flex w-full items-center justify-between gap-10">
        <div className="flex w-1/2 flex-col gap-1">
          <h4 className="text-sm">Identifier</h4>
          <Loader>
            <Loader.Item height="36px" width="100%" />
          </Loader>
        </div>
        <div className="flex w-1/2 flex-col gap-1">
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
