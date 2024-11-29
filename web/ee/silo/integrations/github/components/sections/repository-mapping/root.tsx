"use client";

import { FC, Fragment } from "react";
import { Button } from "@plane/ui";

export const RepositoryMappingRoot: FC = (props) => {
  const {} = props;

  return (
    <div className="relative space-y-2">
      {/* header */}
      <div className="text-sm font-medium text-custom-text-200">Repository Mapping</div>

      {/* content */}
      <div className="border border-custom-border-200 rounded p-4 space-y-4">
        {/* heading */}
        <div className="relative flex justify-between items-center gap-4">
          <div>
            <div className="text-base font-medium">Repository Mapping</div>
            <div className="text-sm text-custom-text-200">Sync issues from GitHub repository to Plane projects</div>
          </div>
          <Button variant="neutral-primary" size="sm">
            Add
          </Button>
        </div>

        {/* mapped blocks */}
        <div className="relative space-y-3">
          <div className="relative space-y-2">
            {Array.from({ length: 5 }).map((_, index) => (
              <Fragment key={index}>
                <div className="relative flex items-center gap-2 rounded bg-custom-background-90 text-base py-1 px-2">
                  <div className="flex-shrink-0 relative flex justify-center items-center !w-5 !h-5 rounded-sm bg-custom-background-100">
                    I
                  </div>
                  Plane Project
                </div>

                <div>
                  {Array.from({ length: 1 }).map((_, index) => (
                    <div key={index} className="relative flex items-center gap-2 p-2">
                      <div className="flex-shrink-0 relative flex justify-center items-center w-10 h-10 rounded bg-custom-background-90">
                        Icon
                      </div>
                      <div>
                        <div className="text-sm font-medium">Github name</div>
                        <div className="text-xs text-custom-text-200">Issues are synced to Plane project</div>
                      </div>
                    </div>
                  ))}
                </div>
              </Fragment>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
