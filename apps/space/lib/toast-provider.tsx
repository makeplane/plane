/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { ToastWithTheme } from "@/providers/toast";

export function ToastProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ToastWithTheme />
      {children}
    </>
  );
}
