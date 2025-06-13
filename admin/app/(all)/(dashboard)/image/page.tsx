"use client";

import { observer } from "mobx-react";
import useSWR from "swr";
import { Loader } from "@plane/ui";
// hooks
import { useInstance } from "@/hooks/store";
// local
import { InstanceImageConfigForm } from "./form";

const InstanceImagePage = observer(() => {
  // store
  const { formattedConfig, fetchInstanceConfigurations } = useInstance();

  useSWR("INSTANCE_CONFIGURATIONS", () => fetchInstanceConfigurations());

  return (
    <>
      <div className="relative container mx-auto w-full h-full p-4 py-4 space-y-6 flex flex-col">
        <div className="border-b border-custom-border-100 mx-4 py-4 space-y-1 flex-shrink-0">
          <div className="text-xl font-medium text-custom-text-100">Third-party image libraries</div>
          <div className="text-sm font-normal text-custom-text-300">
            Let your users search and choose images from third-party libraries
          </div>
        </div>
        <div className="flex-grow overflow-hidden overflow-y-scroll vertical-scrollbar scrollbar-md px-4">
          {formattedConfig ? (
            <InstanceImageConfigForm config={formattedConfig} />
          ) : (
            <Loader className="space-y-8">
              <Loader.Item height="50px" width="50%" />
              <Loader.Item height="50px" width="20%" />
            </Loader>
          )}
        </div>
      </div>
    </>
  );
});

export default InstanceImagePage;
