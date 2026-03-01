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

export type TDropdownOptions<T> = {
  key: string;
  label: string;
  value: string;
  data?: T;
};

export type TDropdown<T> = {
  dropdownOptions: TDropdownOptions<T>[];
  onChange: (value: string | undefined) => void;
  value: string | undefined;
  placeHolder?: string;
  disabled?: boolean;
  iconExtractor?: (option: T) => React.ReactNode;
  queryExtractor?: (option: T) => string;
};
