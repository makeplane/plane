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

import { Pill, EPillVariant, EPillSize } from "@plane/propel/pill";
import type { RowData } from "../helper";

type TProps = {
  rowData: RowData;
};
export const AccountTypeColumn = (props: TProps) => {
  const { rowData } = props;
  const isSuspended = rowData.member.is_active === false;
  return (
    <div className="w-32">
      {isSuspended ? (
        <div className="flex ">
          <Pill variant={EPillVariant.DEFAULT} size={EPillSize.SM} className="border-none">
            Suspended
          </Pill>
        </div>
      ) : (
        <div className="text-caption-sm-regular">{rowData.member.is_instance_admin ? "Instance Admin" : "User"}</div>
      )}
    </div>
  );
};
