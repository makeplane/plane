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

import Link from "next/link";
import { InstanceNotReady as InstanceNotReadyView } from "@plane/propel/domain/instance";
import { GOD_MODE_URL } from "@plane/constants";
// assets
import GradientLogo from "@/app/assets/auth/gradient-logo.webp?url";
import GradientBgLogo from "@/app/assets/auth/gradient-bg-logo.webp?url";

export function InstanceNotReady() {
  return (
    <InstanceNotReadyView
      gradientLogoSrc={GradientLogo}
      gradientBgLogoSrc={GradientBgLogo}
      getStartedHref={GOD_MODE_URL}
      linkComponent={Link}
    />
  );
}
