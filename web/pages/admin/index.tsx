import { ReactElement } from "react";
import useSWR from "swr";
import { observer } from "mobx-react-lite";
// layouts
import { InstanceAdminLayout } from "layouts/admin-layout";
// types
import { NextPageWithLayout } from "types/app";
// store
import { useMobxStore } from "lib/mobx/store-provider";
// components
import { InstanceGeneralForm } from "components/instance";

const InstanceAdminPage: NextPageWithLayout = observer(() => {
  // store
  const {
    instance: { fetchInstanceInfo, instance },
  } = useMobxStore();

  useSWR("INSTANCE_INFO", () => fetchInstanceInfo());

  return <div>{instance && <InstanceGeneralForm instance={instance} />}</div>;
});

InstanceAdminPage.getLayout = function getLayout(page: ReactElement) {
  return <InstanceAdminLayout>{page}</InstanceAdminLayout>;
};

export default InstanceAdminPage;
