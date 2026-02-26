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

type Props = {
  href?: string | null;
  showLoading?: boolean;
};
export const EmbedLoading: React.FC<Props> = ({ href, showLoading = true }) => {
  if (!showLoading) return null;

  return (
    <div className="flex flex-col w-full mb-2">
      <div className="flex-col items-center w-full rounded-md p-1 mb-1 text-custom-text-300 border border-custom-border-200 truncate">
        <div className="flex w-full items-center rounded-sm animate-pulse border border-custom-border-200">
          <div className="w-20 h-16 bg-custom-background-80 rounded-l-sm rounded-bl-sm border-r border-custom-border-200 mr-3 animate-pulse" />
          <div className="flex-1">
            <div className="h-5 w-3/4 bg-custom-background-80 rounded animate-pulse mb-2" />
            <div className="h-3 mr-4 bg-custom-background-80 rounded animate-pulse" />
          </div>
        </div>
        {href && (
          <a href={href} className="text-xs text-custom-text-300 truncate">
            {href}
          </a>
        )}
      </div>
    </div>
  );
};
