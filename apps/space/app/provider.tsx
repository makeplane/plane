"use client";

import { ThemeProvider } from "next-themes";
// components
import { TranslationProvider } from "@plane/i18n";
import { InstanceProvider } from "@/lib/instance-provider";
import { StoreProvider } from "@/lib/store-provider";
import { ToastProvider } from "@/lib/toast-provider";

interface IAppProvider {
  children: React.ReactNode;
}

export const AppProvider: React.FC<IAppProvider> = (props) => {
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
