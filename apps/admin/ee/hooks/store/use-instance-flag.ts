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

import { useContext } from "react";
// context
import { StoreContext } from "@/providers/store.provider";

export enum E_FEATURE_FLAGS {
  OIDC_SAML_AUTH = "OIDC_SAML_AUTH",
  LDAP_AUTH = "LDAP_AUTH",
}

export const useInstanceFlag = (flag: keyof typeof E_FEATURE_FLAGS, defaultValue: boolean = false): boolean => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useInstanceFlag must be used within StoreProvider");
  return context.instanceFeatureFlags.flags?.[E_FEATURE_FLAGS[flag]] ?? defaultValue;
};
