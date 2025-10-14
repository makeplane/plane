"use client";

import { ThemeProvider } from "next-themes";
// components
import { TranslationProvider } from "@plane/i18n";
import { InstanceProvider } from "@/lib/instance-provider";
import { StoreProvider } from "@/lib/store-provider";
import { ToastProvider } from "@/lib/toast-provider";

export function AppProviders({ children }: { children: React.ReactNode }) {
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
}
