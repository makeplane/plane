"use client";

import { FC, useState } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
import { MessageSquare } from "lucide-react";
import { IFormattedInstanceConfiguration } from "@plane/types";
import { ToggleSwitch } from "@plane/ui";
// hooks
import { useInstance } from "@/hooks/store";

type TIntercomConfig = {
  isTelemetryEnabled: boolean;
};

export const IntercomConfig: FC<TIntercomConfig> = observer((props) => {
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
    submitInstanceConfigurations({ IS_INTERCOM_ENABLED: isIntercomEnabled ? "0" : "1" });
  };

  return (
    <>
      <div className="flex items-center gap-14 px-4 py-3 border border-custom-border-200 rounded">
        <div className="grow flex items-center gap-4">
          <div className="shrink-0">
            <div className="flex items-center justify-center w-10 h-10 bg-custom-background-80 rounded-full">
              <MessageSquare className="w-6 h-6 text-custom-text-300/80 p-0.5" />
            </div>
          </div>

          <div className="grow">
            <div className="text-sm font-medium text-custom-text-100 leading-5">Talk to Plane</div>
            <div className="text-xs font-normal text-custom-text-300 leading-5">
              Let your members chat with us via Intercom or another service. Toggling Telemetry off turns this off
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
