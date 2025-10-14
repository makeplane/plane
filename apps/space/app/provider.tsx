"use client";

import type { ReactNode, FC } from "react";
import { ThemeProvider } from "next-themes";
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
    <ThemeProvider themes={["light", "dark"]} defaultTheme="system" enableSystem>
      <StoreProvider>
        <TranslationProvider>
          <ToastProvider>
            <InstanceProvider>{children}</InstanceProvider>
          </ToastProvider>
        </TranslationProvider>
      </StoreProvider>
    </ThemeProvider>
  );
};
