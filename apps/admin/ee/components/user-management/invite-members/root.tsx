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
import type { FC } from "react";
import { FormProvider } from "react-hook-form";
import type { TInstanceAdminCreateFormValues } from "./modal";
import type { UseFormReturn } from "react-hook-form";

type TInviteMemberRootProps = {
  actions: React.ReactNode;
  children: React.ReactNode;
  formMethods: UseFormReturn<TInstanceAdminCreateFormValues>;
};

export const InviteMemberFormRoot: FC<TInviteMemberRootProps> = observer(function InviteMemberFormRoot(
  props: TInviteMemberRootProps
) {
  // props
  const { actions, children, formMethods } = props;
  // hook form
  return (
    <FormProvider {...formMethods}>
      <div className="p-4">
        <h3 className="text-h5-semibold text-18 leading-6 text-primary">Invite instance admin</h3>
        <div className="flex flex-col gap-4 mt-4">{children}</div>
      </div>
      {actions}
    </FormProvider>
  );
});
