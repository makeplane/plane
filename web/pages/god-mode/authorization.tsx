import { ReactElement, useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import { observer } from "mobx-react-lite";
// layouts
import { InstanceAdminLayout } from "layouts/admin-layout";
// types
import { NextPageWithLayout } from "lib/types";
// hooks
import { useApplication } from "hooks/store";
// hooks
import useToast from "hooks/use-toast";
// ui
import { Loader, ToggleSwitch } from "@plane/ui";
// components
import { InstanceGithubConfigForm, InstanceGoogleConfigForm } from "components/instance";

const InstanceAdminAuthorizationPage: NextPageWithLayout = observer(() => {
  // store
  const {
    instance: { fetchInstanceConfigurations, formattedConfig, updateInstanceConfigurations },
  } = useApplication();

  useSWR("INSTANCE_CONFIGURATIONS", () => fetchInstanceConfigurations());

  // toast
  const { setToastAlert } = useToast();

  // state
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const enableSignup = formattedConfig?.ENABLE_SIGNUP ?? "0";
  const enableMagicLogin = formattedConfig?.ENABLE_MAGIC_LINK_LOGIN ?? "0";
  // const enableEmailPassword = formattedConfig?.ENABLE_EMAIL_PASSWORD ?? "0";

  const updateConfig = async (
    key: "ENABLE_SIGNUP" | "ENABLE_MAGIC_LINK_LOGIN" | "ENABLE_EMAIL_PASSWORD",
    value: string
  ) => {
    setIsSubmitting(true);

    const payload = {
      [key]: value,
    };

    await updateInstanceConfigurations(payload)
      .then(() => {
        setToastAlert({
          title: "Success",
          type: "success",
          message: "SSO and OAuth Settings updated successfully",
        });
        setIsSubmitting(false);
      })
      .catch((err) => {
        console.error(err);
        setToastAlert({
          title: "Error",
          type: "error",
          message: "Failed to update SSO and OAuth Settings",
        });
        setIsSubmitting(false);
      });
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="mb-2 border-b border-custom-border-100 pb-3">
        <div className="pb-1 text-xl font-medium text-custom-text-100">Single sign-on and OAuth</div>
        <div className="text-sm font-normal text-custom-text-300">
          Make your teams life easy by letting them sign-up with their Google and GitHub accounts, and below are the
          settings.
        </div>
      </div>
      {formattedConfig ? (
        <>
          <div className="flex w-full flex-col gap-12 border-b border-custom-border-100 pb-8 lg:w-2/5">
            <div className="pointer-events-none mr-4 flex items-center gap-14 opacity-50">
              <div className="grow">
                <div className="text-sm font-medium text-custom-text-100">
                  Turn Magic Links {Boolean(parseInt(enableMagicLogin)) ? "off" : "on"}
                </div>
                <div className="text-xs font-normal text-custom-text-300">
                  <p>Slack-like emails for authentication.</p>
                  You need to have set up email{" "}
                  <Link href="email">
                    <span className="text-custom-primary-100 hover:underline">here</span>
                  </Link>{" "}
                  to enable this.
                </div>
              </div>
              <div className={`shrink-0 ${isSubmitting && "opacity-70"}`}>
                <ToggleSwitch
                  value={Boolean(parseInt(enableMagicLogin))}
                  // onChange={() => {
                  //   Boolean(parseInt(enableMagicLogin)) === true
                  //     ? updateConfig("ENABLE_MAGIC_LINK_LOGIN", "0")
                  //     : updateConfig("ENABLE_MAGIC_LINK_LOGIN", "1");
                  // }}
                  onChange={() => {}}
                  size="sm"
                  disabled={isSubmitting}
                />
              </div>
            </div>
            <div className="mr-4 flex items-center gap-14">
              <div className="grow">
                <div className="text-sm font-medium text-custom-text-100">
                  Let your users log in via the methods below
                </div>
                <div className="text-xs font-normal text-custom-text-300">
                  Toggling this off will disable all previous configs. Users will only be able to login with an e-mail
                  and password combo.
                </div>
              </div>
              <div className={`shrink-0 ${isSubmitting && "opacity-70"}`}>
                <ToggleSwitch
                  value={Boolean(parseInt(enableSignup))}
                  onChange={() => {
                    Boolean(parseInt(enableSignup)) === true
                      ? updateConfig("ENABLE_SIGNUP", "0")
                      : updateConfig("ENABLE_SIGNUP", "1");
                  }}
                  size="sm"
                  disabled={isSubmitting}
                />
              </div>
            </div>
            {/* <div className="flex items-center gap-14 mr-4">
              <div className="grow">
                <div className="text-custom-text-100 font-medium text-sm">
                  Turn Email Password {Boolean(parseInt(enableEmailPassword)) ? "off" : "on"}
                </div>
                <div className="text-custom-text-300 font-normal text-xs">UX Copy Required!</div>
              </div>
              <div className={`shrink-0 ${isSubmitting && "opacity-70"}`}>
                <ToggleSwitch
                  value={Boolean(parseInt(enableEmailPassword))}
                  onChange={() => {
                    Boolean(parseInt(enableEmailPassword)) === true
                      ? updateConfig("ENABLE_EMAIL_PASSWORD", "0")
                      : updateConfig("ENABLE_EMAIL_PASSWORD", "1");
                  }}
                  size="sm"
                  disabled={isSubmitting}
                />
              </div>
            </div> */}
          </div>
          <div className="flex flex-col gap-y-6 py-2">
            <div className="w-full">
              <div className="flex items-center justify-between border-b border-custom-border-100 py-2">
                <span className="text-lg font-medium tracking-tight">Google</span>
              </div>
              <div className="px-2 py-6">
                <InstanceGoogleConfigForm config={formattedConfig} />
              </div>
            </div>
            <div className="w-full">
              <div className="flex items-center justify-between border-b border-custom-border-100 py-2">
                <span className="text-lg font-medium tracking-tight">Github</span>
              </div>
              <div className="px-2 py-6">
                <InstanceGithubConfigForm config={formattedConfig} />
              </div>
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

InstanceAdminAuthorizationPage.getLayout = function getLayout(page: ReactElement) {
  return <InstanceAdminLayout>{page}</InstanceAdminLayout>;
};

export default InstanceAdminAuthorizationPage;
