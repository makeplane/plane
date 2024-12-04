"use client";

import { FC, ReactNode } from "react";
// components
import { InstanceProvider } from "@/lib/instance-provider";
import { StoreProvider } from "@/lib/store-provider";
import { ToastProvider } from "@/lib/toast-provider";

interface IAppProvider {
  children: ReactNode;
}

export const AppProvider: FC<IAppProvider> = (props) => {
  const { children } = props;

  return (
    <StoreProvider>
      <ToastProvider>
        <InstanceProvider>{children}</InstanceProvider>
      </ToastProvider>
    </StoreProvider>
  );
};
