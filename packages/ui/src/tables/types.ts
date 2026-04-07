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

import type React from "react";

export type TTableColumn<T> = {
  key: string;
  content: string;
  thRender?: () => React.ReactNode;
  tdRender: (rowData: T) => React.ReactNode;
};

export type TTableData<T> = {
  data: T[];
  columns: TTableColumn<T>[];
  keyExtractor: (rowData: T) => string;
  renderRow?: (props: { rowData: T; children: React.ReactNode; className: string }) => React.ReactNode;
  // classNames
  tableClassName?: string;
  tHeadClassName?: string;
  tHeadTrClassName?: string;
  thClassName?: string;
  tBodyClassName?: string;
  tBodyTrClassName?: string;
  tdClassName?: string;
  isLoading?: boolean;
  emptyState?: React.ReactNode;
};
