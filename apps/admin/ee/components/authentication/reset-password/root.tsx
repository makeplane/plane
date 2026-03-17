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

import { AuthHeader } from "@/app/(all)/(home)/auth-header";
import { observer } from "mobx-react";
import type { FC } from "react";
import { ResetPasswordForm } from "./form";

export const ResetPasswordRoot: FC = observer(function ResetPasswordRoot() {
  return (
    <>
      <AuthHeader />
      {/* Reset Passwor Form */}
      <div className="flex flex-col h-full items-center justify-center">
        <ResetPasswordForm />
      </div>
    </>
  );
});
