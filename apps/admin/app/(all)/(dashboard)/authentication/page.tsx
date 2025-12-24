import { useState } from "react";
import { observer } from "mobx-react";
import { useTheme } from "next-themes";
import useSWR from "swr";
// plane internal packages
import { setPromiseToast } from "@plane/propel/toast";
import type { TInstanceConfigurationKeys } from "@plane/types";
import { Loader, ToggleSwitch } from "@plane/ui";
import { cn, resolveGeneralTheme } from "@plane/utils";
// components
import { PageWrapper } from "@/components/common/page-wrapper";
// hooks
import { AuthenticationMethodCard } from "@/components/authentication/authentication-method-card";
import { useAuthenticationModes } from "@/hooks/oauth";
import { useInstance } from "@/hooks/store";
// types
import type { Route } from "./+types/page";

const InstanceAuthenticationPage = observer(function InstanceAuthenticationPage(_props: Route.ComponentProps) {
  // theme
  const { resolvedTheme: resolvedThemeAdmin } = useTheme();
  // store
  const { fetchInstanceConfigurations, formattedConfig, updateInstanceConfigurations } = useInstance();
  // state
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  // derived values
  const enableSignUpConfig = formattedConfig?.ENABLE_SIGNUP ?? "";
  const resolvedTheme = resolveGeneralTheme(resolvedThemeAdmin);

  useSWR("INSTANCE_CONFIGURATIONS", () => fetchInstanceConfigurations());

  const updateConfig = async (key: TInstanceConfigurationKeys, value: string) => {
    setIsSubmitting(true);

    const payload = {
      [key]: value,
    };

    const updateConfigPromise = updateInstanceConfigurations(payload);

    setPromiseToast(updateConfigPromise, {
      loading: "Saving configuration",
      success: {
        title: "Success",
        message: () => "Configuration saved successfully",
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

  const authenticationModes = useAuthenticationModes({ disabled: isSubmitting, updateConfig, resolvedTheme });
  return (
    <PageWrapper
      header={{
        title: "Manage authentication modes for your instance",
        description: "Configure authentication modes for your team and restrict sign-ups to be invite only.",
      }}
    >
      {formattedConfig ? (
        <div className="space-y-3">
          <div className={cn("w-full flex items-center gap-14 rounded-sm")}>
            <div className="flex grow items-center gap-4">
              <div className="grow">
                <div className="text-16 font-medium pb-1">Allow anyone to sign up even without an invite</div>
                <div className={cn("font-regular leading-5 text-tertiary text-11")}>
                  Toggling this off will only let users sign up when they are invited.
                </div>
              </div>
            </div>
            <div className={`shrink-0 pr-4 ${isSubmitting && "opacity-70"}`}>
              <div className="flex items-center gap-4">
                <ToggleSwitch
                  value={Boolean(parseInt(enableSignUpConfig))}
                  onChange={() => {
                    if (Boolean(parseInt(enableSignUpConfig)) === true) {
                      updateConfig("ENABLE_SIGNUP", "0");
                    } else {
                      updateConfig("ENABLE_SIGNUP", "1");
                    }
                  }}
                  size="sm"
                  disabled={isSubmitting}
                />
              </div>
            </div>
          </div>
          <div className="text-lg font-medium pt-6">Available authentication modes</div>
          {authenticationModes.map((method) => (
            <AuthenticationMethodCard
              key={method.key}
              name={method.name}
              description={method.description}
              icon={method.icon}
              config={method.config}
              disabled={isSubmitting}
              unavailable={method.unavailable}
            />
          ))}
        </div>
      ) : (
        <Loader className="space-y-10">
          <Loader.Item height="50px" width="75%" />
          <Loader.Item height="50px" width="75%" />
          <Loader.Item height="50px" width="40%" />
          <Loader.Item height="50px" width="40%" />
          <Loader.Item height="50px" width="20%" />
        </Loader>
      )}
    </PageWrapper>
  );
});

export const meta: Route.MetaFunction = () => [{ title: "Authentication Settings - Plane Web" }];

export default InstanceAuthenticationPage;
