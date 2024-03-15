"use client";

import useSWR from "swr";
import { observer } from "mobx-react-lite";
// hooks
import useInstance from "hooks/use-instance";
// ui
import { Loader } from "@plane/ui";
// components
import { InstanceImageConfigForm } from "components/image";

const InstanceImagePage = observer(() => {
  // store
  const { fetchInstanceConfigurations, formattedConfig } = useInstance();

  useSWR("INSTANCE_CONFIGURATIONS", () => fetchInstanceConfigurations());

  return (
    <div className="flex flex-col gap-8">
      <div className="mb-2 border-b border-custom-border-100 pb-3">
        <div className="pb-1 text-xl font-medium text-custom-text-100">Third-party image libraries</div>
        <div className="text-sm font-normal text-custom-text-300">
          Let your users search and choose images from third-party libraries
        </div>
      </div>
      {formattedConfig ? (
        <InstanceImageConfigForm config={formattedConfig} />
      ) : (
        <Loader className="space-y-8">
          <Loader.Item height="50px" width="50%" />
          <Loader.Item height="50px" width="20%" />
        </Loader>
      )}
    </div>
  );
});

export default InstanceImagePage;
