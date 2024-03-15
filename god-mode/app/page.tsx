"use client";

import useSWR from "swr";
import { observer } from "mobx-react-lite";
// hooks
import useInstance from "hooks/use-instance";
// ui
import { Loader } from "@plane/ui";
// components
import { InstanceGeneralForm } from "components/general";
// import { PageHead } from "components/core";

const GeneralSettingsPage = observer(() => {
  // store
  const { instance, instanceAdmins, fetchInstanceInfo, fetchInstanceAdmins } = useInstance();

  // fetching instance information
  useSWR("INSTANCE_INFO", () => fetchInstanceInfo());
  // fetching instance admins
  useSWR("INSTANCE_ADMINS", () => fetchInstanceAdmins());

  return (
    <>
      {/* <PageHead title="God Mode - General Settings" /> */}
      <div className="flex h-full w-full max-w-6xl flex-col gap-4">
        <div className="border-b border-custom-border-100 pb-3">
          <div className="pb-1 text-xl font-medium text-custom-text-100">General settings</div>
          <div className="text-sm font-normal text-custom-text-300">
            Change the name of your instance and instance admin e-mail addresses. Enable or disable telemetry in your
            instance.
          </div>
        </div>
        {instance && instanceAdmins ? (
          <>
            <div className="pt-2 text-lg font-medium">Instance details</div>
            <InstanceGeneralForm instance={instance} instanceAdmins={instanceAdmins} />
          </>
        ) : (
          <Loader className="space-y-4">
            <Loader.Item height="50px" width="40%" />
            <Loader.Item height="50px" width="90%" />
            <Loader.Item height="50px" width="90%" />
            <Loader.Item height="50px" width="20%" />
          </Loader>
        )}
      </div>
    </>
  );
});

export default GeneralSettingsPage;
