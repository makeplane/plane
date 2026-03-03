/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
import { MessageSquare } from "lucide-react";
import type { IFormattedInstanceConfiguration } from "@plane/types";
import { ToggleSwitch } from "@plane/ui";
// hooks
import { useInstance } from "@/hooks/store";

type TIntercomConfig = {
  isTelemetryEnabled: boolean;
};

export const IntercomConfig = observer(function IntercomConfig(props: TIntercomConfig) {
  const { isTelemetryEnabled } = props;
  // hooks
  const { instanceConfigurations, updateInstanceConfigurations, fetchInstanceConfigurations } = useInstance();
  // states
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // derived values
  const isIntercomEnabled = isTelemetryEnabled
    ? instanceConfigurations
      ? instanceConfigurations?.find((config) => config.key === "IS_INTERCOM_ENABLED")?.value === "1"
        ? true
        : false
      : undefined
    : false;

  const { isLoading } = useSWR(isTelemetryEnabled ? "INSTANCE_CONFIGURATIONS" : null, () =>
    isTelemetryEnabled ? fetchInstanceConfigurations() : null
  );

  const initialLoader = isLoading && isIntercomEnabled === undefined;

  const submitInstanceConfigurations = async (payload: Partial<IFormattedInstanceConfiguration>) => {
    try {
      await updateInstanceConfigurations(payload);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const enableIntercomConfig = () => {
    void submitInstanceConfigurations({ IS_INTERCOM_ENABLED: isIntercomEnabled ? "0" : "1" });
  };

  return (
    <>
      <div className="flex items-center gap-14">
        <div className="flex grow items-center gap-4">
          <div className="shrink-0">
            <div className="flex size-11 items-center justify-center rounded-lg bg-layer-1">
              <MessageSquare className="size-5 p-0.5 text-tertiary" />
            </div>
          </div>

          <div className="grow">
            <div className="text-13 leading-5 font-medium text-primary">Chat with us</div>
            <div className="text-11 leading-5 font-regular text-tertiary">
              Let your users chat with us via Intercom or another service. Toggling Telemetry off turns this off
              automatically.
            </div>
          </div>

          <div className="ml-auto">
            <ToggleSwitch
              value={isIntercomEnabled ? true : false}
              onChange={enableIntercomConfig}
              size="sm"
              disabled={!isTelemetryEnabled || isSubmitting || initialLoader}
            />
          </div>
        </div>
      </div>
    </>
  );
});
