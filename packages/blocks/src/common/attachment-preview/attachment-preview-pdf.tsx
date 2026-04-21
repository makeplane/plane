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

import { useState } from "react";
import type { SyntheticEvent } from "react";

export type AttachmentPreviewPdfProps = {
  src: string;
  downloadSrc: string;
  name: string;
};

export function AttachmentPreviewPdf({ src, downloadSrc, name }: AttachmentPreviewPdfProps) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 text-center" data-testid="preview-pdf">
        <p className="text-sm text-white/50">Unable to render PDF inline.</p>
        <a href={downloadSrc} download={name} className="text-sm font-medium text-white underline">
          Download instead
        </a>
      </div>
    );
  }

  const handleLoad = (e: SyntheticEvent<HTMLIFrameElement>) => {
    try {
      const doc = e.currentTarget.contentDocument;
      if (doc && doc.body.childElementCount === 0 && doc.body.innerText === "") setFailed(true);
    } catch {
      // cross-origin — browser PDF viewer is handling it, which is fine
    }
  };

  return (
    <iframe
      data-testid="preview-pdf"
      src={src}
      title={name}
      sandbox="allow-scripts"
      className="h-full w-full rounded-lg border-0"
      onLoad={handleLoad}
    />
  );
}
