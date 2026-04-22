/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { ThemeProvider } from "@plane/react-theme";
import { SWRConfig } from "swr";
import { AppProgressBar } from "@/lib/b-progress";
// local imports
import { ToastWithTheme } from "./toast";
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
    <ThemeProvider themes={["system", "light", "dark"]}>
      <AppProgressBar />
      <ToastWithTheme />
      <SWRConfig value={DEFAULT_SWR_CONFIG}>
        <StoreProvider>
          <InstanceProvider>
            <UserProvider>{children}</UserProvider>
          </InstanceProvider>
        </StoreProvider>
      </SWRConfig>
    </ThemeProvider>
  );
}
