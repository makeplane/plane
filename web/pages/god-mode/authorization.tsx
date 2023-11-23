import { ReactElement, useState } from "react";
import useSWR from "swr";
import { observer } from "mobx-react-lite";
// layouts
import { InstanceAdminHeader, InstanceAdminLayout } from "layouts/admin-layout";
// types
import { NextPageWithLayout } from "types/app";
// store
import { useMobxStore } from "lib/mobx/store-provider";
// hooks
import useToast from "hooks/use-toast";
// icons
import { ChevronDown, ChevronRight } from "lucide-react";
// ui
import { Loader, ToggleSwitch } from "@plane/ui";
import { Disclosure, Transition } from "@headlessui/react";
// components
import { InstanceGoogleConfigForm } from "components/instance/google-config-form";
import { InstanceGithubConfigForm } from "components/instance/github-config-form";

const InstanceAdminAuthorizationPage: NextPageWithLayout = observer(() => {
  // store
  const {
    instance: { fetchInstanceConfigurations, formattedConfig, updateInstanceConfigurations },
  } = useMobxStore();

  useSWR("INSTANCE_CONFIGURATIONS", () => fetchInstanceConfigurations());

  // toast
  const { setToastAlert } = useToast();

  // state
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const enableSignup = formattedConfig?.ENABLE_SIGNUP ?? "0";

  const updateConfig = async (value: string) => {
    setIsSubmitting(true);

    const payload = {
      ENABLE_SIGNUP: value,
    };

    await updateInstanceConfigurations(payload)
      .then(() => {
        setToastAlert({
          title: "Success",
          type: "success",
          message: "Authorization Settings updated successfully",
        });
        setIsSubmitting(false);
      })
      .catch((err) => {
        console.error(err);
        setToastAlert({
          title: "Error",
          type: "error",
          message: "Failed to update Authorization Settings",
        });
        setIsSubmitting(false);
      });
  };

  return (
    <div>
      {formattedConfig ? (
        <div className="flex flex-col gap-8 m-8 w-4/5">
          <div className="pb-2 mb-2 border-b border-custom-border-100">
            <div className="text-custom-text-100 font-medium text-lg">Authorization</div>
            <div className="text-custom-text-300 font-normal text-sm">
              Make your teams life easy by letting them sign-up with their Google and GitHub accounts, and below are the
              settings.
            </div>
          </div>
          <div className="flex items-center gap-8 pb-4 border-b border-custom-border-100">
            <div>
              <div className="text-custom-text-100 font-medium text-sm">Enable sign-up</div>
              <div className="text-custom-text-300 font-normal text-xs">
                Keep the doors open so people can join your workspaces.
              </div>
            </div>
            <div className={isSubmitting ? "opacity-70" : ""}>
              <ToggleSwitch
                value={Boolean(parseInt(enableSignup))}
                onChange={() => {
                  Boolean(parseInt(enableSignup)) === true ? updateConfig("0") : updateConfig("1");
                }}
                size="sm"
                disabled={isSubmitting}
              />
            </div>
          </div>
          <div className="flex flex-col gap-y-6 py-2">
            <Disclosure as="div">
              {({ open }) => (
                <div className="w-full">
                  <Disclosure.Button
                    as="button"
                    type="button"
                    className="flex items-center justify-between w-full py-2 border-b border-custom-border-100"
                  >
                    <span className="text-lg font-medium tracking-tight">Google</span>
                    {open ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                  </Disclosure.Button>
                  <Transition
                    show={open}
                    enter="transition duration-100 ease-out"
                    enterFrom="transform opacity-0"
                    enterTo="transform opacity-100"
                    leave="transition duration-75 ease-out"
                    leaveFrom="transform opacity-100"
                    leaveTo="transform opacity-0"
                  >
                    <Disclosure.Panel className="flex flex-col gap-8 px-2 py-8">
                      <InstanceGoogleConfigForm config={formattedConfig} />
                    </Disclosure.Panel>
                  </Transition>
                </div>
              )}
            </Disclosure>
            <Disclosure as="div">
              {({ open }) => (
                <div className="w-full">
                  <Disclosure.Button
                    as="button"
                    type="button"
                    className="flex items-center justify-between w-full py-2 border-b border-custom-border-100"
                  >
                    <span className="text-lg font-medium tracking-tight">Github</span>
                    {open ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                  </Disclosure.Button>
                  <Transition
                    show={open}
                    enter="transition duration-100 ease-out"
                    enterFrom="transform opacity-0"
                    enterTo="transform opacity-100"
                    leave="transition duration-75 ease-out"
                    leaveFrom="transform opacity-100"
                    leaveTo="transform opacity-0"
                  >
                    <Disclosure.Panel className="flex flex-col gap-8 px-2 py-8">
                      <InstanceGithubConfigForm config={formattedConfig} />
                    </Disclosure.Panel>
                  </Transition>
                </div>
              )}
            </Disclosure>
          </div>
        </div>
      ) : (
        <Loader className="space-y-4 m-8">
          <Loader.Item height="50px" />
          <Loader.Item height="50px" />
          <Loader.Item height="50px" />
          <Loader.Item height="50px" width="25%" />
        </Loader>
      )}
    </div>
  );
});

InstanceAdminAuthorizationPage.getLayout = function getLayout(page: ReactElement) {
  return <InstanceAdminLayout header={<InstanceAdminHeader title="Authorization" />}>{page}</InstanceAdminLayout>;
};

export default InstanceAdminAuthorizationPage;
