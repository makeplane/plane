import { ReactElement } from "react";
import useSWR from "swr";
import { observer } from "mobx-react-lite";
// layouts
import { InstanceAdminLayout } from "layouts/admin-layout";
// types
import { NextPageWithLayout } from "lib/types";
// hooks
import { useApplication } from "hooks/store";
// ui
import { Loader } from "@plane/ui";
// components
import { InstancePagesConfigForm } from "components/instance/pages-config-form";

const InstanceAdminPagesPage: NextPageWithLayout = observer(() => {
  // store
  const {
    instance: { fetchInstanceConfigurations, formattedConfig },
  } = useApplication();

  useSWR("INSTANCE_CONFIGURATIONS", () => fetchInstanceConfigurations());

  return (
    <div className="flex flex-col gap-8">
      <div className="mb-2 border-b border-custom-border-100 pb-3">
        <div className="pb-1 text-xl font-medium text-custom-text-100">Pages</div>
        <div className="text-sm font-normal text-custom-text-300">
          Configure how your pages are stored.
        </div>
      </div>
      {formattedConfig ? (
        <InstancePagesConfigForm config={formattedConfig} />
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
  );
});

InstanceAdminPagesPage.getLayout = function getLayout(page: ReactElement) {
  return <InstanceAdminLayout>{page}</InstanceAdminLayout>;
};

export default InstanceAdminPagesPage;
