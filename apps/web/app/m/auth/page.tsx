"use client";

import React from "react";
import { observer } from "mobx-react";
import { TInstanceConfig } from "@plane/types";
// hooks
import { useInstance } from "@/hooks/store";
// components
import { AuthRoot } from "@/plane-web/components/mobile";

const MobileAuth = observer(() => {
  // hooks
  const { config } = useInstance();

  return (
    <div className="isolate relative z-10 flex flex-col items-center w-screen h-screen overflow-hidden overflow-y-auto pt-6 pb-10 px-8">
      <div className="flex flex-col justify-center items-center flex-grow w-full py-6 mt-10">
        <div className="relative flex flex-col gap-6 max-w-[22.5rem] w-full">
          <AuthRoot config={config as TInstanceConfig} />
        </div>
      </div>
    </div>
  );
});

export default MobileAuth;
