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

import type { FC } from "react";
import React from "react";

type TProps = {
  link: string;
};

export function SourceItem(props: TProps) {
  const { link } = props;
  // TODO: Add favicon from backend
  // const faviconUrl = useMemo(() => `https://www.google.com/s2/favicons?domain=${link}&sz=${40}`, [link]);
  return (
    <div className="flex gap-2 items-center max-w-40 truncate">
      {/* TODO: Add favicon from backend */}
      {/* {link && <Image src={faviconUrl} height={20} width={20} alt="favicon" />} */}
      <p className="text-13 truncate">{link}</p>
    </div>
  );
}
