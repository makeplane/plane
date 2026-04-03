/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// assets
import LogoSpinnerImg from "@/app/assets/images/logo-spinner.svg?url";

export function InstanceLoading() {

  const logoSrc = LogoSpinnerImg;

  return (
    <div className="flex items-center justify-center">
      <img src={logoSrc} alt="logo" className="h-6 w-auto sm:h-11" />
    </div>
  );
}
