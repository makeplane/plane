import { ReactElement } from "react";
import useSWR from "swr";
import { observer } from "mobx-react-lite";
// layouts
import { InstanceAdminHeader, InstanceAdminLayout } from "layouts/admin-layout";
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
    <div>
      {formattedConfig ? (
        <InstanceEmailForm config={formattedConfig} />
      ) : (
        <Loader className="space-y-4 m-8">
        <Loader.Item height="50px" />
        <Loader.Item height="50px" />
        <Loader.Item height="50px" width="25%" />
        <Loader.Item height="50px" width="25%" />
        <Loader.Item height="50px" width="25%" />
      </Loader>
      )}
    </div>
  )
});

InstanceAdminEmailPage.getLayout = function getLayout(page: ReactElement) {
  return <InstanceAdminLayout header={<InstanceAdminHeader title="Email" />}>{page}</InstanceAdminLayout>;
};

export default InstanceAdminEmailPage;
