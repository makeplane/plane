"use client";

import { useEffect, useState } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { Loader, ToggleSwitch } from "@plane/ui";
// hooks
import { useInstance } from "@/hooks/store";
// components
import { InstanceEmailForm } from "./email-config-form";

const InstanceEmailPage: React.FC = observer(() => {
  // store
  const { fetchInstanceConfigurations, formattedConfig, disableEmail } = useInstance();

  const { isLoading } = useSWR("INSTANCE_CONFIGURATIONS", () => fetchInstanceConfigurations());

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSMTPEnabled, setIsSMTPEnabled] = useState(false);

  const handleToggle = async () => {
    if (isSMTPEnabled) {
      setIsSubmitting(true);
      try {
        await disableEmail();
        setIsSMTPEnabled(false);
        setToast({
          title: "Email feature disabled",
          message: "Email feature has been disabled",
          type: TOAST_TYPE.SUCCESS,
        });
      } catch (_error) {
        setToast({
          title: "Error disabling email",
          message: "Failed to disable email feature. Please try again.",
          type: TOAST_TYPE.ERROR,
        });
      } finally {
        setIsSubmitting(false);
      }
      return;
    }
    setIsSMTPEnabled(true);
  };
  useEffect(() => {
    if (formattedConfig) {
      setIsSMTPEnabled(formattedConfig.ENABLE_SMTP === "1");
    }
  }, [formattedConfig]);

  return (
    <>
      <div className="relative container mx-auto w-full h-full p-4 py-4 space-y-6 flex flex-col">
        <div className="flex items-center justify-between gap-4 border-b border-custom-border-100 mx-4 py-4 space-y-1 flex-shrink-0">
          <div className="py-4 space-y-1 flex-shrink-0">
            <div className="text-xl font-medium text-custom-text-100">Secure emails from your own instance</div>
            <div className="text-sm font-normal text-custom-text-300">
              Plane can send useful emails to you and your users from your own instance without talking to the Internet.
              <div className="text-sm font-normal text-custom-text-300">
                Set it up below and please test your settings before you save them.&nbsp;
                <span className="text-red-400">Misconfigs can lead to email bounces and errors.</span>
              </div>
            </div>
          </div>
          {isLoading ? (
            <Loader>
              <Loader.Item width="24px" height="16px" className="rounded-full" />
            </Loader>
          ) : (
            <ToggleSwitch value={isSMTPEnabled} onChange={handleToggle} size="sm" disabled={isSubmitting} />
          )}
        </div>
        {isSMTPEnabled && !isLoading && (
          <div className="flex-grow overflow-hidden overflow-y-scroll vertical-scrollbar scrollbar-md px-4">
            {formattedConfig ? (
              <InstanceEmailForm config={formattedConfig} />
            ) : (
              <Loader className="space-y-10">
                <Loader.Item height="50px" width="75%" />
                <Loader.Item height="50px" width="75%" />
                <Loader.Item height="50px" width="40%" />
                <Loader.Item height="50px" width="40%" />
                <Loader.Item height="50px" width="20%" />
              </Loader>
            )}
          </div>
        )}
      </div>
    </>
  );
});

export default InstanceEmailPage;
