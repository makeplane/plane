"use client";
import { observer } from "mobx-react-lite";
// hooks
import { useInstance } from "@/hooks/store";
// components
import { GeneralConfigurationForm } from "./form";

function GeneralPage() {
  const { instance, instanceAdmins } = useInstance();
  console.log("instance", instance);
  return (
    <>
      <div className="relative container mx-auto w-full h-full p-8 py-4 space-y-6 flex flex-col">
        <div className="border-b border-custom-border-100 pb-3 space-y-1 flex-shrink-0">
          <div className="text-xl font-medium text-custom-text-100">General settings</div>
          <div className="text-sm font-normal text-custom-text-300">
            Change the name of your instance and instance admin e-mail addresses. Enable or disable telemetry in your
            instance.
          </div>
        </div>
        <div className="flex-grow overflow-hidden overflow-y-auto">
          {instance && instanceAdmins && (
            <GeneralConfigurationForm instance={instance} instanceAdmins={instanceAdmins} />
          )}
        </div>
      </div>
    </>
  );
}

export default observer(GeneralPage);
