import { ReactElement } from "react";
import { observer } from "mobx-react-lite";
import useSWR from "swr";
// layouts
import { Loader } from "@plane/ui";
import { PageHead } from "@/components/core";
import { InstanceGeneralForm } from "@/components/instance";
import { useApplication } from "@/hooks/store";
import { InstanceAdminLayout } from "@/layouts/admin-layout";
// types
import { NextPageWithLayout } from "@/lib/types";
// hooks
// ui
// components

const InstanceAdminPage: NextPageWithLayout = observer(() => {
  // store hooks
  const {
    instance: { fetchInstanceInfo, instance, fetchInstanceAdmins, instanceAdmins },
  } = useApplication();

  useSWR("INSTANCE_INFO", () => fetchInstanceInfo());
  useSWR("INSTANCE_ADMINS", () => fetchInstanceAdmins());

  return (
    <>
      <PageHead title="God Mode - General Settings" />
      <div className="flex h-full w-full flex-col gap-8">
        <div className="mb-2 border-b border-custom-border-100 pb-3">
          <div className="pb-1 text-xl font-medium text-custom-text-100">ID your instance easily</div>
          <div className="text-sm font-normal text-custom-text-300">
            Change the name of your instance and instance admin e-mail addresses. If you have a paid subscription, you
            will find your license key here.
          </div>
        </div>
        {instance && instanceAdmins ? (
          <InstanceGeneralForm instance={instance} instanceAdmins={instanceAdmins} />
        ) : (
          <Loader className="space-y-4">
            <div className="grid grid-cols-2 gap-x-8 gap-y-4">
              <Loader.Item height="50px" />
              <Loader.Item height="50px" />
            </div>
            <Loader.Item height="50px" />
          </Loader>
        )}
      </div>
    </>
  );
});

InstanceAdminPage.getLayout = function getLayout(page: ReactElement) {
  return <InstanceAdminLayout>{page}</InstanceAdminLayout>;
};

export default InstanceAdminPage;
