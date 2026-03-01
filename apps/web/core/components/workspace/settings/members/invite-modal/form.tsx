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
import { Dialog } from "@headlessui/react";

type TInvitationFormProps = {
  title: string;
  description: React.ReactNode;
  children: React.ReactNode;
  onSubmit: () => void;
  actions: React.ReactNode;
  className?: string;
};

export const InvitationForm = observer(function InvitationForm(props: TInvitationFormProps) {
  const { title, description, children, actions, onSubmit, className } = props;

  return (
    <form onSubmit={onSubmit} className={className}>
      <div className="space-y-4">
        <Dialog.Title as="h3" className="text-body-md-medium leading-6 text-primary">
          {title}
        </Dialog.Title>
        <div className="text-body-xs-regular text-secondary">{description}</div>
        {children}
      </div>
      {actions}
    </form>
  );
});
