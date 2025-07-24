"use client";
import { observer } from "mobx-react";
// hooks
import { useInstance } from "@/hooks/store";
// components
import { GeneralConfigurationForm } from "./form";

function GeneralPage() {
  const { instance, instanceAdmins } = useInstance();

  return (
    <>
      <div className="relative container mx-auto w-full h-full p-4 py-4 space-y-6 flex flex-col">
        <div className="border-b border-custom-border-100 mx-4 py-4 space-y-1 flex-shrink-0">
          <div className="text-xl font-medium text-custom-text-100">General settings</div>
          <div className="text-sm font-normal text-custom-text-300">
            Change the name of your instance and instance admin e-mail addresses. Enable or disable telemetry in your
            instance.
          </div>
        </div>
        <div className="flex-grow overflow-hidden overflow-y-scroll vertical-scrollbar scrollbar-md px-4">
          {instance && instanceAdmins && (
            <GeneralConfigurationForm instance={instance} instanceAdmins={instanceAdmins} />
          )}
        </div>
      </div>
    </>
  );
}

export default observer(GeneralPage);
