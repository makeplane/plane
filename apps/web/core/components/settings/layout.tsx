/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useRef } from "react";
import { observer } from "mobx-react";

export const SettingsContentLayout = observer(function SettingsContentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // refs
  const ref = useRef<HTMLDivElement>(null);

  return (
    <div className="w-full h-full min-h-full overflow-y-scroll " ref={ref}>
      {children}
    </div>
  );
});
