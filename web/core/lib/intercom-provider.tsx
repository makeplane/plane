"use client";

import React, { FC, useEffect } from "react";
import Intercom from "@intercom/messenger-js-sdk";
import { observer } from "mobx-react";
// store hooks
import { useUser, useTransientSettings } from "@/hooks/store";

export type IntercomProviderProps = {
  children: React.ReactNode;
};

const IntercomProvider: FC<IntercomProviderProps> = observer((props) => {
  const { children } = props;
  const { data: user } = useUser();
  const { chatWindowEnabled } = useTransientSettings();

  useEffect(() => {
    if (user && chatWindowEnabled) {
      Intercom({
        app_id: process.env.NEXT_PUBLIC_INTERCOM_APP_ID || "",
        user_id: user.id,
        name: `${user.first_name} ${user.last_name}`,
        email: user.email,
      });
    }
  }, [user, chatWindowEnabled]);

  return <>{children}</>;
});

export default IntercomProvider;
