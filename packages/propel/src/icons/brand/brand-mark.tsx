/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import * as React from "react";
import { hasCustomBrandLogo } from "@plane/utils";
import { PlaneLogo } from "./plane-logo";
import { PlaneLockup } from "./plane-lockup";

type TBrandMarkProps = {
  logoUrl?: string | null;
  name?: string;
  className?: string;
  variant?: "mark" | "lockup";
};

export function BrandMark(props: TBrandMarkProps) {
  const { logoUrl, name = "Plane", className, variant = "mark" } = props;

  if (hasCustomBrandLogo(logoUrl)) {
    return <img src={logoUrl as string} alt={name} className={className} />;
  }

  if (variant === "lockup") {
    return <PlaneLockup height={20} width={95} className={className} />;
  }

  return <PlaneLogo className={className} />;
}
