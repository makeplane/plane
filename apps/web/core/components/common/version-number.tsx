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

import { observer } from "mobx-react";
// assets
import packageJson from "package.json";
// hooks

import { useInstance } from "@/hooks/store/use-instance";

export const PlaneVersionNumber = observer(function PlaneVersionNumber() {
  const { instance, config } = useInstance();

  if (config?.payment_server_base_url) {
    return <span>Version: Latest</span>;
  }

  if (instance?.current_version) {
    return <span>Version: {instance.current_version || "Stable"}</span>;
  }

  return <span>Version: v{packageJson.version}</span>;
});
