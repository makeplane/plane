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

type TModalFormHeader = {
  title: string;
  description: string;
};

export function ModalFormHeader({ title, description }: TModalFormHeader) {
  return (
    <div className="flex flex-col gap-1.5">
      <h5 className="text-h5-medium text-primary">{title}</h5>
      <p className="text-body-xs-regular text-secondary">{description}</p>
    </div>
  );
}
