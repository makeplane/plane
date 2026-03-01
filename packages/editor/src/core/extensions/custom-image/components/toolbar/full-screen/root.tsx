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

import { Maximize } from "lucide-react";
import { useEffect, useState } from "react";
// plane imports
import { Tooltip } from "@plane/propel/tooltip";
// local imports
import { ImageFullScreenModal } from "./modal";

type Props = {
  image: {
    alt: string | undefined;
    aspectRatio: number;
    downloadSrc: string;
    height: string;
    src: string;
    width: string;
  };
  isTouchDevice: boolean;
  toggleToolbarViewStatus: (val: boolean) => void;
};

export function ImageFullScreenActionRoot(props: Props) {
  const { image, isTouchDevice, toggleToolbarViewStatus } = props;
  // states
  const [isFullScreenEnabled, setIsFullScreenEnabled] = useState(false);
  // derived values
  const { alt, downloadSrc, src, width, aspectRatio } = image;

  useEffect(() => {
    toggleToolbarViewStatus(isFullScreenEnabled);
  }, [isFullScreenEnabled, toggleToolbarViewStatus]);

  return (
    <>
      <ImageFullScreenModal
        alt={alt}
        aspectRatio={aspectRatio}
        downloadSrc={downloadSrc}
        isFullScreenEnabled={isFullScreenEnabled}
        isTouchDevice={isTouchDevice}
        src={src}
        width={width}
        toggleFullScreenMode={setIsFullScreenEnabled}
      />
      <Tooltip tooltipContent="View in full screen" disabled={isTouchDevice}>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsFullScreenEnabled(true);
          }}
          className="flex-shrink-0 h-full grid place-items-center text-on-color/60 hover:text-on-color transition-colors"
          aria-label="View image in full screen"
        >
          <Maximize className="size-3" />
        </button>
      </Tooltip>
    </>
  );
}
