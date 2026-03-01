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

// plane imports
import { cn } from "@plane/propel/utils";

type TProviderHeaderProps = {
  action?: React.ReactNode;
  description: string;
  logo: string;
  logoAlt: string;
  logoClassName?: string;
  title: string;
};

export function ProviderHeader(props: TProviderHeaderProps) {
  const { action, description, logo, logoAlt, logoClassName, title } = props;

  return (
    <div className="flex items-center justify-between gap-6 border-b border-subtle pb-4">
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0 size-10 rounded-lg bg-layer-1 flex items-center justify-center p-1.5">
          <img src={logo} alt={logoAlt} className={cn("w-7", logoClassName)} />
        </div>
        <div className="flex flex-col gap-0.5">
          <div className="text-body-sm-medium text-primary">{title}</div>
          <div className="text-body-xs-regular text-tertiary">{description}</div>
        </div>
      </div>
      {action && <div className="flex items-center gap-2">{action}</div>}
    </div>
  );
}
