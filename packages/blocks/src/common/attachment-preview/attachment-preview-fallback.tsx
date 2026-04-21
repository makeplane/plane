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

export type AttachmentPreviewFallbackLabels = {
  notAvailable: string;
  downloadHint: string;
};

const DEFAULT_LABELS: AttachmentPreviewFallbackLabels = {
  notAvailable: "Preview is not available for this file.",
  downloadHint: "Use the actions above to download or open this file.",
};

export type AttachmentPreviewFallbackProps = {
  name: string;
  extension: string;
  labels?: Partial<AttachmentPreviewFallbackLabels>;
};

export function AttachmentPreviewFallback({ name, extension, labels: labelsProp }: AttachmentPreviewFallbackProps) {
  const labels = { ...DEFAULT_LABELS, ...labelsProp };

  return (
    <div className="flex flex-col items-center justify-center gap-3 text-center" data-testid="preview-fallback">
      <div className="flex size-16 items-center justify-center rounded-xl bg-white/10 text-2xl font-bold uppercase text-white/40">
        {extension.slice(0, 4)}
      </div>
      <p className="text-sm text-white/60">
        {labels.notAvailable.includes("{name}") ? (
          <>
            {labels.notAvailable.split("{name}")[0]}
            <span className="font-medium text-white">{name}</span>
            {labels.notAvailable.split("{name}")[1]}
          </>
        ) : (
          <>
            {labels.notAvailable} <span className="font-medium text-white">{name}</span>
          </>
        )}
      </p>
      <p className="text-xs text-white/40">{labels.downloadHint}</p>
    </div>
  );
}
