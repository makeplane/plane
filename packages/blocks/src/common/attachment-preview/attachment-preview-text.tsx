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

import { useEffect, useState } from "react";
import { MAX_TEXT_PREVIEW_BYTES } from "./attachment-preview.utils";

export type AttachmentPreviewTextProps = {
  src: string;
  size: number;
};

type TextPreviewState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "loaded"; content: string };

export function AttachmentPreviewText({ src, size }: AttachmentPreviewTextProps) {
  const tooLarge = size > MAX_TEXT_PREVIEW_BYTES;
  const [state, setState] = useState<TextPreviewState>(
    tooLarge ? { status: "error", message: "File is too large to preview." } : { status: "loading" }
  );

  useEffect(() => {
    if (tooLarge) return;

    const controller = new AbortController();

    fetch(src, { signal: controller.signal, credentials: "include" })
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load (${res.status})`);
        return res.text();
      })
      .then((content) => setState({ status: "loaded", content }))
      .catch((err: unknown) => {
        if (err instanceof Error && err.name === "AbortError") return;
        setState({
          status: "error",
          message: err instanceof Error ? err.message : "Failed to load text content.",
        });
      });

    return () => controller.abort();
  }, [src, tooLarge]);

  if (state.status === "loading") {
    return (
      <div className="flex h-full w-full items-center justify-center" data-testid="preview-text">
        <p className="text-sm text-white/50" data-testid="preview-text-loading">
          Loading preview…
        </p>
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="flex h-full w-full items-center justify-center" data-testid="preview-text">
        <p className="text-sm text-white/50">{state.message}</p>
      </div>
    );
  }

  return (
    <div className="h-full w-full overflow-auto rounded-lg bg-white/5" data-testid="preview-text">
      <pre className="whitespace-pre-wrap break-words p-4 text-sm text-white/90">{state.content}</pre>
    </div>
  );
}
