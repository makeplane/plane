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

import React, { useMemo } from "react";
import type { EditorRefApi } from "@plane/editor";
import { useScrollSync } from "@/hooks/use-scroll-sync";

type Props = {
  children: React.ReactNode;
  editorRef?: React.RefObject<EditorRefApi | null>;
};

export const EditorScrollConfigWrapper: React.FC<Props> = ({ children, editorRef }) => {
  const isAndroid = useMemo(() => navigator.userAgent.includes("Android"), []);

  // Synchronize window and container scroll for smooth mobile experience
  useScrollSync({ containerId: "mobile-editor-container", enabled: !isAndroid, editorRef });

  return (
    <div className="fixed inset-0 overflow-hidden">
      <div className="h-full overflow-auto pb-80" id="mobile-editor-container">
        {children}
      </div>
    </div>
  );
};
