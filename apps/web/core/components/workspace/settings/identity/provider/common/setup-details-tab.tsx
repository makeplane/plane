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

import type { ReactNode } from "react";

type TProviderSetupDetailsTabProps = {
  title: string;
  children: ReactNode;
};

export function ProviderSetupDetailsTab(props: TProviderSetupDetailsTabProps) {
  const { title, children } = props;

  return (
    <>
      <h5 className="text-body-xs-medium text-secondary bg-layer-1-selected p-3 rounded-t-lg">{title}</h5>
      <div className="p-3 bg-layer-1 rounded-b-lg flex flex-col gap-y-4">{children}</div>
    </>
  );
}
