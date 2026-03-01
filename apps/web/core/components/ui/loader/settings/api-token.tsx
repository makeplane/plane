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

import { range } from "lodash-es";

type Props = {
  title: string;
};

export function APITokenSettingsLoader(props: Props) {
  const { title } = props;
  return (
    <section className="w-full overflow-y-auto">
      <div className="mb-2 flex items-center justify-between border-b border-subtle pb-3.5">
        <h3 className="text-xl font-medium">{title}</h3>
        <span className="h-8 w-28 bg-layer-1 rounded-sm" />
      </div>
      <div className="divide-y-[0.5px] divide-subtle-1">
        {range(2).map((i) => (
          <div key={i} className="flex flex-col gap-2 py-3">
            <div className="flex items-center gap-2">
              <span className="h-5 w-28 bg-layer-1 rounded-sm" />
              <span className="h-5 w-16 bg-layer-1 rounded-sm" />
            </div>
            <span className="h-5 w-36 bg-layer-1 rounded-sm" />
          </div>
        ))}
      </div>
    </section>
  );
}
