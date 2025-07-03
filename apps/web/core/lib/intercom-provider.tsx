"use client";

import React, { FC, useEffect } from "react";
import { Intercom, show, hide, onHide } from "@intercom/messenger-js-sdk";
import { observer } from "mobx-react";
// store hooks
import { useUser, useInstance, useTransient } from "@/hooks/store";

export type IntercomProviderProps = {
  children: React.ReactNode;
};

const IntercomProvider: FC<IntercomProviderProps> = observer((props) => {
  const { children } = props;
  // hooks
  const { data: user } = useUser();
  const { config } = useInstance();
  const { isIntercomToggle, toggleIntercom } = useTransient();

  useEffect(() => {
    if (isIntercomToggle) show();
    else hide();
  }, [isIntercomToggle]);

  onHide(() => {
    toggleIntercom(false);
  });

  useEffect(() => {
    if (user && config?.is_intercom_enabled && config.intercom_app_id) {
      Intercom({
        app_id: config.intercom_app_id || "",
        user_id: user.id,
        name: `${user.first_name} ${user.last_name}`,
        email: user.email,
        hide_default_launcher: true,
      });
    }
  }, [user, config, toggleIntercom]);

  return <>{children}</>;
});

export default IntercomProvider;
