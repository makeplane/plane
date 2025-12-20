import { observer } from "mobx-react";
// hooks
import { useInstance } from "@/hooks/store";
// components
import type { Route } from "./+types/page";
import { GeneralConfigurationForm } from "./form";

function GeneralPage() {
  const { instance, instanceAdmins } = useInstance();

  return (
    <>
      <div className="relative container mx-auto w-full h-full p-4 py-4 space-y-6 flex flex-col">
        <div className="border-b border-subtle mx-4 py-4 space-y-1 flex-shrink-0">
          <div className="text-18 font-medium text-primary">General settings</div>
          <div className="text-13 font-regular text-tertiary">
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

export const meta: Route.MetaFunction = () => [{ title: "General Settings - God Mode" }];

export default observer(GeneralPage);
