"use client";

import React, { FC, useEffect } from "react";
import Intercom from "@intercom/messenger-js-sdk";
import { observer } from "mobx-react";
// store hooks
import { useUser, useInstance } from "@/hooks/store";

export type IntercomProviderProps = {
  children: React.ReactNode;
};

const IntercomProvider: FC<IntercomProviderProps> = observer((props) => {
  const { children } = props;
  // hooks
  const { data: user } = useUser();
  const { config } = useInstance();

  useEffect(() => {
    if (user && config?.is_intercom_enabled && config.intercom_app_id) {
      Intercom({
        app_id: config.intercom_app_id || "",
        user_id: user.id,
        name: `${user.first_name} ${user.last_name}`,
        email: user.email,
      });
    }
  }, [user, config]);

  return <>{children}</>;
});

export default IntercomProvider;
