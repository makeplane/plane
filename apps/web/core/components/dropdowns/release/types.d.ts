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

export type TReleaseDropdownBaseProps = {
  releases: {
    id: string;
    name: string;
  }[];
  value: string[];
  onChange: (value: string[]) => void | Promise<void>;
  disabled?: boolean;
  className?: string;
  buttonClassName?: string;
  emptyLabel?: string;
};

export type TReleaseDropdownProps = Omit<TReleaseDropdownBaseProps, "releases"> & {
  workspaceSlug?: string;
};
