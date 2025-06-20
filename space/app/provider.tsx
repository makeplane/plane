"use client";

import { FC, ReactNode } from "react";
// components
import { TranslationProvider } from "@plane/i18n";
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
      <TranslationProvider>
        <ToastProvider>
          <InstanceProvider>{children}</InstanceProvider>
        </ToastProvider>
      </TranslationProvider>
    </StoreProvider>
  );
};
