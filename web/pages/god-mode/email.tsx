import { ReactElement } from "react";
import useSWR from "swr";
import { observer } from "mobx-react-lite";
// layouts
import { InstanceAdminLayout } from "layouts/admin-layout";
// types
import { NextPageWithLayout } from "types/app";
// store
import { useMobxStore } from "lib/mobx/store-provider";
// ui
import { Loader } from "@plane/ui";
// components
import { InstanceEmailForm } from "components/instance/email-form";

const InstanceAdminEmailPage: NextPageWithLayout = observer(() => {
  // store
  const {
    instance: { fetchInstanceConfigurations, formattedConfig },
  } = useMobxStore();

  useSWR("INSTANCE_CONFIGURATIONS", () => fetchInstanceConfigurations());

  return (
    <div className="flex flex-col gap-8 my-8 mx-12 w-4/5">
      <div className="pb-3 mb-2 border-b border-custom-border-100">
        <div className="text-custom-text-100 font-medium text-xl pb-1">Secure emails from your own instance</div>
        <div className="text-custom-text-300 font-normal text-sm">
          Plane can send useful emails to you and your users from your own instance without talking to the Internet.
        </div>
        <div className="text-custom-text-300 font-normal text-sm">
          Set it up below and please test your settings before you save them.{" "}
          <span className="text-red-400">Misconfigs can lead to email bounces and errors.</span>
        </div>
      </div>
      {formattedConfig ? (
        <InstanceEmailForm config={formattedConfig} />
      ) : (
        <Loader className="space-y-4">
          <Loader.Item height="50px" />
          <Loader.Item height="50px" />
          <Loader.Item height="50px" width="25%" />
          <Loader.Item height="50px" width="25%" />
          <Loader.Item height="50px" width="25%" />
        </Loader>
      )}
    </div>
  );
});

InstanceAdminEmailPage.getLayout = function getLayout(page: ReactElement) {
  return <InstanceAdminLayout>{page}</InstanceAdminLayout>;
};

export default InstanceAdminEmailPage;
