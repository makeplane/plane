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
import { InstanceGeneralForm } from "components/instance";

const InstanceAdminPage: NextPageWithLayout = observer(() => {
  // store
  const {
    instance: { fetchInstanceInfo, instance },
  } = useMobxStore();

  useSWR("INSTANCE_INFO", () => fetchInstanceInfo());

  return (
    <div>
      {instance ? (
        <InstanceGeneralForm instance={instance} />
      ) : (
        <Loader className="space-y-4 m-8">
          <Loader.Item height="50px" />
          <Loader.Item height="50px" width="50%" />
          <Loader.Item height="50px" width="25%" />
        </Loader>
      )}
    </div>
  );
});

InstanceAdminPage.getLayout = function getLayout(page: ReactElement) {
  return <InstanceAdminLayout header={<InstanceAdminHeader title="General" />}>{page}</InstanceAdminLayout>;
};

export default InstanceAdminPage;
