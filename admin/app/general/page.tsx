"use client";

import { observer } from "mobx-react-lite";
// components
import { PageHeader } from "@/components/core";
import { InstanceGeneralForm } from "@/components/general";
// hooks
import { useInstance } from "@/hooks";

const GeneralPage = observer(() => {
  const { instance } = useInstance();

  return (
    <>
      <PageHeader title="General Settings - God Mode" />
      <div className="flex h-full w-full max-w-6xl flex-col gap-4">
        <div className="border-b border-custom-border-100 pb-3">
          <div className="pb-1 text-xl font-medium text-custom-text-100">General settings</div>
          <div className="text-sm font-normal text-custom-text-300">
            Change the name of your instance and instance admin e-mail addresses. Enable or disable telemetry in your
            instance.
          </div>
        </div>
        {instance && (
          <>
            <div className="pt-2 text-lg font-medium">Instance details</div>
            <InstanceGeneralForm instance={instance} instanceAdmins={[]} />
          </>
        )}
      </div>
    </>
  );
});

export default GeneralPage;
