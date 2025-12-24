import { useState } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
import { setPromiseToast } from "@plane/propel/toast";
import { Loader, ToggleSwitch } from "@plane/ui";
// assets
import GoogleLogo from "@/app/assets/logos/google-logo.svg?url";
// components
import { AuthenticationMethodCard } from "@/components/authentication/authentication-method-card";
import { PageWrapper } from "@/components/common/page-wrapper";
// hooks
import { useInstance } from "@/hooks/store";
// types
import type { Route } from "./+types/page";
// local
import { InstanceGoogleConfigForm } from "./form";

const InstanceGoogleAuthenticationPage = observer(function InstanceGoogleAuthenticationPage(
  _props: Route.ComponentProps
) {
  // store
  const { fetchInstanceConfigurations, formattedConfig, updateInstanceConfigurations } = useInstance();
  // state
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  // config
  const enableGoogleConfig = formattedConfig?.IS_GOOGLE_ENABLED ?? "";

  useSWR("INSTANCE_CONFIGURATIONS", () => fetchInstanceConfigurations());

  const updateConfig = async (key: "IS_GOOGLE_ENABLED", value: string) => {
    setIsSubmitting(true);

    const payload = {
      [key]: value,
    };

    const updateConfigPromise = updateInstanceConfigurations(payload);

    setPromiseToast(updateConfigPromise, {
      loading: "Saving Configuration",
      success: {
        title: "Configuration saved",
        message: () => `Google authentication is now ${value === "1" ? "active" : "disabled"}.`,
      },
      error: {
        title: "Error",
        message: () => "Failed to save configuration",
      },
    });

    await updateConfigPromise
      .then(() => {
        setIsSubmitting(false);
      })
      .catch((err) => {
        console.error(err);
        setIsSubmitting(false);
      });
  };
  return (
    <PageWrapper
      customHeader={
        <AuthenticationMethodCard
          name="Google"
          description="Allow members to login or sign up to plane with their Google
            accounts."
          icon={<img src={GoogleLogo} height={24} width={24} alt="Google Logo" />}
          config={
            <ToggleSwitch
              value={Boolean(parseInt(enableGoogleConfig))}
              onChange={() => {
                if (Boolean(parseInt(enableGoogleConfig)) === true) {
                  updateConfig("IS_GOOGLE_ENABLED", "0");
                } else {
                  updateConfig("IS_GOOGLE_ENABLED", "1");
                }
              }}
              size="sm"
              disabled={isSubmitting || !formattedConfig}
            />
          }
          disabled={isSubmitting || !formattedConfig}
          withBorder={false}
        />
      }
    >
      {formattedConfig ? (
        <InstanceGoogleConfigForm config={formattedConfig} />
      ) : (
        <Loader className="space-y-8">
          <Loader.Item height="50px" width="25%" />
          <Loader.Item height="50px" />
          <Loader.Item height="50px" />
          <Loader.Item height="50px" />
          <Loader.Item height="50px" width="50%" />
        </Loader>
      )}
    </PageWrapper>
  );
});

export const meta: Route.MetaFunction = () => [{ title: "Google Authentication - God Mode" }];

export default InstanceGoogleAuthenticationPage;
