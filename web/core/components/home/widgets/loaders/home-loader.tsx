"use client";

import range from "lodash/range";
// ui
import { Loader } from "@plane/ui";

export const HomeLoader = () => (
  <>
    {range(3).map((index) => (
      <div key={index}>
        <div className="mb-2">
          <div className="text-base font-semibold text-custom-text-350 mb-4">
            <Loader.Item height="20px" width="100px" />
          </div>
          <Loader className="h-[110px] w-full flex items-center justify-center gap-2 text-custom-text-400 rounded">
            <Loader.Item height="100%" width="100%" />
          </Loader>
        </div>
      </div>
    ))}
  </>
);
