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

import type { FC, ReactNode } from "react";
import { ThemeProvider } from "next-themes";
// mobx store provider
import { StoreProvider } from "@/lib/store-context";

export interface IAppProvider {
  children: ReactNode;
}

const themes = ["light", "dark"];

export const AppProvider: FC<IAppProvider> = (props) => {
  const { children } = props;
  return (
    <>
      <StoreProvider>
        <ThemeProvider themes={themes} defaultTheme="system">
          {children}
        </ThemeProvider>
      </StoreProvider>
    </>
  );
};
