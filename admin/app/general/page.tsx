"use client";

import { observer } from "mobx-react-lite";
// components
import { PageHeader } from "@/components/core";
import { GeneralConfigurationForm } from "./components";
// hooks
import { useInstance } from "@/hooks/store";

const GeneralPage = observer(() => {
  const { instance, instanceAdmins } = useInstance();

  return (
    <>
      <PageHeader title="General Settings - God Mode" />
      <div className="relative container mx-auto w-full h-full p-8 py-4 space-y-6 flex flex-col">
        <div className="border-b border-custom-border-100 pb-3 space-y-1 flex-shrink-0">
          <div className="text-xl font-medium text-custom-text-100">General settings</div>
          <div className="text-sm font-normal text-custom-text-300">
            Change the name of your instance and instance admin e-mail addresses. Enable or disable telemetry in your
            instance.
          </div>
        </div>
        <div className="flex-grow overflow-hidden overflow-y-auto">
          {instance?.instance && instanceAdmins && instanceAdmins?.length > 0 && (
            <GeneralConfigurationForm instance={instance?.instance} instanceAdmins={instanceAdmins} />
          )}
        </div>
      </div>
    </>
  );
});

export default GeneralPage;
