/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { useCallback, useRef, useState } from "react";
import { observer } from "mobx-react";
import { useTheme } from "next-themes";
import useSWR from "swr";
// plane internal packages
import { setPromiseToast, setToast, TOAST_TYPE } from "@plane/propel/toast";
import { Switch } from "@plane/propel/switch";
import type { TInstanceConfigurationKeys, TInstanceAuthenticationModes } from "@plane/types";
import { Loader } from "@plane/ui";
import { cn, resolveGeneralTheme } from "@plane/utils";
// components
import { PageWrapper } from "@/components/common/page-wrapper";
import { AuthenticationMethodCard } from "@/components/authentication/authentication-method-card";
// helpers
import { canDisableAuthMethod } from "@/helpers/authentication";
// hooks
import { useAuthenticationModes } from "@/hooks/oauth";
import { useInstance } from "@/hooks/store";
// types
import type { Route } from "./+types/page";

const InstanceAuthenticationPage = observer(function InstanceAuthenticationPage(_props: Route.ComponentProps) {
  // theme
  const { resolvedTheme: resolvedThemeAdmin } = useTheme();
  const resolvedTheme = resolveGeneralTheme(resolvedThemeAdmin);
  // Ref to store authentication modes for validation (avoids circular dependency)
  const authenticationModesRef = useRef<TInstanceAuthenticationModes[]>([]);
  // state
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  // store hooks
  const { fetchInstanceConfigurations, formattedConfig, updateInstanceConfigurations } = useInstance();
  // derived values
  const enableSignUpConfig = formattedConfig?.ENABLE_SIGNUP ?? "";

  useSWR("INSTANCE_CONFIGURATIONS", () => fetchInstanceConfigurations());

  // Create updateConfig with validation - uses authenticationModesRef for current modes
  const updateConfig = useCallback(
    (key: TInstanceConfigurationKeys, value: string): void => {
      // Check if trying to disable (value === "0")
      if (value === "0") {
        // Check if this key is an authentication method key
        const currentAuthModes = authenticationModesRef.current;
        const isAuthMethodKey = currentAuthModes.some((method) => method.enabledConfigKey === key);

        // Only validate if this is an authentication method key
        if (isAuthMethodKey) {
          const canDisable = canDisableAuthMethod(key, currentAuthModes, formattedConfig);

          if (!canDisable) {
            setToast({
              type: TOAST_TYPE.ERROR,
              title: "Cannot disable authentication",
              message:
                "At least one authentication method must remain enabled. Please enable another method before disabling this one.",
            });
            return;
          }
        }
      }

      // Proceed with the update
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

      void updateConfigPromise
        .then(() => {
          setIsSubmitting(false);
          return undefined;
        })
        .catch((err) => {
          console.error(err);
          setIsSubmitting(false);
        });
    },
    [formattedConfig, updateInstanceConfigurations]
  );

  // Get authentication modes - this will use updateConfig which includes validation
  const authenticationModes = useAuthenticationModes({
    disabled: isSubmitting,
    updateConfig,
    resolvedTheme,
  });

  // Update ref with latest authentication modes
  authenticationModesRef.current = authenticationModes;

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
                <Switch
                  value={Boolean(parseInt(enableSignUpConfig))}
                  onChange={() => {
                    if (Boolean(parseInt(enableSignUpConfig)) === true) {
                      updateConfig("ENABLE_SIGNUP", "0");
                    } else {
                      updateConfig("ENABLE_SIGNUP", "1");
                    }
                  }}
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
