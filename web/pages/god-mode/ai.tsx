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
// icons
import { Lightbulb } from "lucide-react";
// components
import { InstanceAIForm } from "components/instance/ai-form";

const InstanceAdminAIPage: NextPageWithLayout = observer(() => {
  // store
  const {
    instance: { fetchInstanceConfigurations, formattedConfig },
  } = useMobxStore();

  useSWR("INSTANCE_CONFIGURATIONS", () => fetchInstanceConfigurations());

  return (
    <div className="flex flex-col gap-8 my-8 mx-12">
      <div className="pb-3 mb-2 border-b border-custom-border-100">
        <div className="text-custom-text-100 font-medium text-xl pb-1">AI features for all your workspaces</div>
        <div className="text-custom-text-300 font-normal text-sm">
          Configure your AI API credentials so Plane AI features are turned on for all your workspaces.
        </div>
      </div>
      {formattedConfig ? (
        <>
          <div>
            <div className="text-custom-text-100 font-medium text-xl pb-1">OpenAI</div>
            <div className="text-custom-text-300 font-normal text-sm">If you use ChatGPT, this is for you.</div>
          </div>
          <InstanceAIForm config={formattedConfig} />
          <div className="flex my-2">
            <div className="flex items-center gap-2 px-4 py-2 text-xs text-custom-primary-200 bg-custom-primary-100/10 border border-custom-primary-100/20 rounded">
              <Lightbulb height="14" width="14" />
              <div>If you have a preferred AI models vendor, please get in touch with us.</div>
            </div>
          </div>
        </>
      ) : (
        <Loader className="space-y-4">
          <Loader.Item height="50px" width="50%" />
          <Loader.Item height="50px" width="50%" />
          <Loader.Item height="50px" width="25%" />
        </Loader>
      )}
    </div>
  );
});

InstanceAdminAIPage.getLayout = function getLayout(page: ReactElement) {
  return <InstanceAdminLayout>{page}</InstanceAdminLayout>;
};

export default InstanceAdminAIPage;
