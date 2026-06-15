/**
 * Copyright (c) 2023-present Gizmo Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useContext } from "react";
import { StoreContext } from "@/lib/store-context";
import type { IMailStore } from "@/store/mail";

export const useMail = (): IMailStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useMail must be used within StoreProvider");
  return context.mail;
};
