import React, { useEffect, useRef } from "react";
import { Intercom, show, hide, onHide } from "@intercom/messenger-js-sdk";
import { observer } from "mobx-react";
// store hooks
import { useInstance } from "@/hooks/store/use-instance";
import { useTransient } from "@/hooks/store/use-transient";
import { useUser } from "@/hooks/store/user";

export type IntercomProviderProps = {
  children: React.ReactNode;
};

const IntercomProvider = observer(function IntercomProvider(props: IntercomProviderProps) {
  const { children } = props;
  // hooks
  const { data: user } = useUser();
  const { config } = useInstance();
  const { isIntercomToggle, toggleIntercom } = useTransient();
  // refs
  const isInitializedRef = useRef(false);
  // derived values
  const isIntercomEnabled = user && config && config.is_intercom_enabled && config.intercom_app_id;

  useEffect(() => {
    if (!isInitializedRef.current) return;
    if (isIntercomToggle) show();
    else hide();
  }, [isIntercomToggle]);

  useEffect(() => {
    if (!isInitializedRef.current) return;
    onHide(() => {
      toggleIntercom(false);
    });
  }, [toggleIntercom]);

  useEffect(() => {
    if (!isIntercomEnabled || isInitializedRef.current) return; // prevent multiple initializations
    Intercom({
      app_id: config.intercom_app_id || "",
      user_id: user.id,
      name: `${user.first_name} ${user.last_name}`,
      email: user.email,
      hide_default_launcher: true,
    });
    isInitializedRef.current = true;
  }, [isIntercomEnabled, config, user]);

  return <>{children}</>;
});

export default IntercomProvider;
