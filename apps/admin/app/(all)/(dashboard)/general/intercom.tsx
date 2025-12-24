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
        <div className="grow flex items-center gap-4">
          <div className="shrink-0">
            <div className="flex items-center justify-center size-11 bg-layer-1 rounded-lg">
              <MessageSquare className="size-5 text-tertiary p-0.5" />
            </div>
          </div>

          <div className="grow">
            <div className="text-13 font-medium text-primary leading-5">Chat with us</div>
            <div className="text-11 font-regular text-tertiary leading-5">
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
