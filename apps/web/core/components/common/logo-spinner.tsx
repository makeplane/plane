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

// assets
import LogoSpinnerDark from "@/app/assets/images/logo-spinner-dark.gif?url";
import LogoSpinnerLight from "@/app/assets/images/logo-spinner-light.gif?url";

export function LogoSpinner() {
  return (
    <div className="flex items-center justify-center">
      <img src={LogoSpinnerLight} alt="logo" className="h-6 w-auto sm:h-11 object-contain dark:hidden" />
      <img src={LogoSpinnerDark} alt="logo" className="hidden h-6 w-auto sm:h-11 object-contain dark:block" />
    </div>
  );
}
