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
// icons
import { Lightbulb } from "lucide-react";
// components
import { InstanceAIForm } from "components/instance";

const InstanceAdminAIPage: NextPageWithLayout = observer(() => {
  // store
  const {
    instance: { fetchInstanceConfigurations, formattedConfig },
  } = useApplication();

  useSWR("INSTANCE_CONFIGURATIONS", () => fetchInstanceConfigurations());

  return (
    <div className="flex flex-col gap-8">
      <div className="mb-2 border-b border-custom-border-100 pb-3">
        <div className="pb-1 text-xl font-medium text-custom-text-100">AI features for all your workspaces</div>
        <div className="text-sm font-normal text-custom-text-300">
          Configure your AI API credentials so Plane AI features are turned on for all your workspaces.
        </div>
      </div>
      {formattedConfig ? (
        <>
          <div>
            <div className="pb-1 text-xl font-medium text-custom-text-100">OpenAI</div>
            <div className="text-sm font-normal text-custom-text-300">If you use ChatGPT, this is for you.</div>
          </div>
          <InstanceAIForm config={formattedConfig} />
          <div className="my-2 flex">
            <div className="flex items-center gap-2 rounded border border-custom-primary-100/20 bg-custom-primary-100/10 px-4 py-2 text-xs text-custom-primary-200">
              <Lightbulb height="14" width="14" />
              <div>If you have a preferred AI models vendor, please get in touch with us.</div>
            </div>
          </div>
        </>
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

InstanceAdminAIPage.getLayout = function getLayout(page: ReactElement) {
  return <InstanceAdminLayout>{page}</InstanceAdminLayout>;
};

export default InstanceAdminAIPage;
