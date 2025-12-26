import { useEffect, useState } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { Loader, ToggleSwitch } from "@plane/ui";
// components
import { PageWrapper } from "@/components/common/page-wrapper";
// hooks
import { useInstance } from "@/hooks/store";
// types
import type { Route } from "./+types/page";
// local
import { InstanceEmailForm } from "./email-config-form";

const InstanceEmailPage = observer(function InstanceEmailPage(_props: Route.ComponentProps) {
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
    <PageWrapper
      header={{
        title: "Secure emails from your own instance",
        description: (
          <>
            Plane can send useful emails to you and your users from your own instance without talking to the Internet.
            <div className="text-13 font-regular text-tertiary">
              Set it up below and please test your settings before you save them.&nbsp;
              <span className="text-danger-primary">Misconfigs can lead to email bounces and errors.</span>
            </div>
          </>
        ),
        actions: isLoading ? (
          <Loader>
            <Loader.Item width="24px" height="16px" className="rounded-full" />
          </Loader>
        ) : (
          <ToggleSwitch value={isSMTPEnabled} onChange={handleToggle} size="sm" disabled={isSubmitting} />
        ),
      }}
    >
      {isSMTPEnabled && !isLoading && (
        <>
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
        </>
      )}
    </PageWrapper>
  );
});

export const meta: Route.MetaFunction = () => [{ title: "Email Settings - God Mode" }];

export default InstanceEmailPage;
