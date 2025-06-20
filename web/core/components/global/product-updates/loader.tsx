import React from "react";
import { Loader } from "@plane/ui";

export const ChangeLogLoader = () => (
  <Loader className="flex flex-col gap-3 h-full w-full ">
    {/* header */}
    <div className="flex items-center gap-2 mb-3">
      <Loader.Item height="44px" width="500px" />
    </div>
    {/* body */}
    <Loader.Item height="36px" width="300px" />
    <Loader.Item height="26px" width="60%" />
    <Loader.Item height="26px" width="100%" />
    <Loader.Item height="26px" width="75%" />
    <Loader.Item height="26px" width="80%" />
  </Loader>
);
