"use client";

import { observer } from "mobx-react";
import useSWR from "swr";
import { Loader } from "@plane/ui";
// hooks
import { useInstance } from "@/hooks/store";
// components
import { InstanceAIForm } from "./form";

const InstanceAIPage = observer(() => {
  // store
  const { fetchInstanceConfigurations, formattedConfig } = useInstance();

  useSWR("INSTANCE_CONFIGURATIONS", () => fetchInstanceConfigurations());

  return (
    <>
      <div className="relative container mx-auto w-full h-full p-4 py-4 space-y-6 flex flex-col">
        <div className="border-b border-custom-border-100 mx-4 py-4 space-y-1 flex-shrink-0">
          <div className="text-xl font-medium text-custom-text-100">AI features for all your workspaces</div>
          <div className="text-sm font-normal text-custom-text-300">
            Configure your AI API credentials so Plane AI features are turned on for all your workspaces.
          </div>
        </div>
        <div className="flex-grow overflow-hidden overflow-y-scroll vertical-scrollbar scrollbar-md px-4">
          {formattedConfig ? (
            <InstanceAIForm config={formattedConfig} />
          ) : (
            <Loader className="space-y-8">
              <Loader.Item height="50px" width="40%" />
              <div className="w-2/3 grid grid-cols-2 gap-x-8 gap-y-4">
                <Loader.Item height="50px" />
                <Loader.Item height="50px" />
              </div>
              <Loader.Item height="50px" width="20%" />
            </Loader>
          )}
        </div>
      </div>
    </>
  );
});

export default InstanceAIPage;
