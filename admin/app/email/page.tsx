"use client";

import { observer } from "mobx-react-lite";
import useSWR from "swr";
import { Loader } from "@plane/ui";
// components
import { PageHeader } from "@/components/core";
// hooks
import { useInstance } from "@/hooks/store";
// components
import { InstanceEmailForm } from "./email-config-form";

const InstanceEmailPage = observer(() => {
  // store
  const { fetchInstanceConfigurations, formattedConfig } = useInstance();

  useSWR("INSTANCE_CONFIGURATIONS", () => fetchInstanceConfigurations());

  return (
    <>
      <PageHeader title="Email - God Mode" />
      <div className="relative container mx-auto w-full h-full p-8 py-4 space-y-6 flex flex-col">
        <div className="border-b border-custom-border-100 pb-3 space-y-1 flex-shrink-0">
          <div className="text-xl font-medium text-custom-text-100">Secure emails from your own instance</div>
          <div className="text-sm font-normal text-custom-text-300">
            Plane can send useful emails to you and your users from your own instance without talking to the Internet.
            <div className="text-sm font-normal text-custom-text-300">
              Set it up below and please test your settings before you save them.&nbsp;
              <span className="text-red-400">Misconfigs can lead to email bounces and errors.</span>
            </div>
          </div>
        </div>
        <div className="flex-grow overflow-hidden overflow-y-auto">
          {formattedConfig ? (
            <InstanceEmailForm config={formattedConfig} />
          ) : (
            <Loader className="space-y-10">
              <Loader.Item height="50px" width="75%" />
              <Loader.Item height="50px" width="75%" />
              <Loader.Item height="50px" width="40%" />
              <Loader.Item height="50px" width="40%" />
              <Loader.Item height="50px" width="20%" />
            </Loader>
          )}
        </div>
      </div>
    </>
  );
});

export default InstanceEmailPage;
