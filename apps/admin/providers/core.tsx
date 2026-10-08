/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { ThemeProvider } from "next-themes";
import { SWRConfig } from "swr";
import { PlaneToastProvider } from "@plane/blocks/toast";
import { TranslationProvider } from "@plane/i18n";
import { AppProgressBar } from "@/lib/b-progress";
// local imports
import { StoreProvider } from "./store.provider";
import { InstanceProvider } from "./instance.provider";
import { UserProvider } from "./user.provider";

const DEFAULT_SWR_CONFIG = {
  refreshWhenHidden: false,
  revalidateIfStale: false,
  revalidateOnFocus: false,
  revalidateOnMount: true,
  refreshInterval: 600_000,
  errorRetryCount: 3,
};

export function CoreProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider themes={["light", "dark"]} defaultTheme="system" enableSystem>
      <AppProgressBar />
      {/* The toast viewport is a provider that calls `useTranslation`. Admin had no i18n provider,
          so TranslationProvider is mounted here for it. */}
      <TranslationProvider>
        <PlaneToastProvider>
          <SWRConfig value={DEFAULT_SWR_CONFIG}>
            <StoreProvider>
              <InstanceProvider>
                <UserProvider>{children}</UserProvider>
              </InstanceProvider>
            </StoreProvider>
          </SWRConfig>
        </PlaneToastProvider>
      </TranslationProvider>
    </ThemeProvider>
  );
}
