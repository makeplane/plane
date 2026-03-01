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

type TFormCardProps = {
  title: string;
  children: React.ReactNode;
  infoComponent?: React.ReactNode;
};

export function FormCard(props: TFormCardProps) {
  const { title, children, infoComponent } = props;

  return (
    <div className="space-y-1">
      <h4 className="text-13 font-semibold text-placeholder">{title}</h4>
      <div className="flex flex-col w-full gap-3 border border-subtle-1 rounded-md bg-layer-1/70 px-4 py-3">
        {children}
      </div>
      {infoComponent}
    </div>
  );
}
