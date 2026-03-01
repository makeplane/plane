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
import { Maximize } from "lucide-react";
// plane imports
import { Tooltip } from "@plane/ui";
// local imports
import { ImageFullScreenModal } from "./modal";

type Props = {
  image: {
    aspectRatio: number;
    downloadSrc: string;
    height: string;
    src: string;
    width: string;
  };
  toggleToolbarViewStatus: (val: boolean) => void;
};

export function ImageFullScreenActionRoot(props: Props) {
  const { image, toggleToolbarViewStatus } = props;
  // states
  const [isFullScreenEnabled, setIsFullScreenEnabled] = useState(false);
  // derived values
  const { downloadSrc, src, width, aspectRatio } = image;

  useEffect(() => {
    toggleToolbarViewStatus(isFullScreenEnabled);
  }, [isFullScreenEnabled, toggleToolbarViewStatus]);

  return (
    <>
      <ImageFullScreenModal
        aspectRatio={aspectRatio}
        downloadSrc={downloadSrc}
        isFullScreenEnabled={isFullScreenEnabled}
        src={src}
        width={width}
        toggleFullScreenMode={setIsFullScreenEnabled}
      />
      <Tooltip tooltipContent="View in full screen">
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsFullScreenEnabled(true);
          }}
          className="flex-shrink-0 h-full grid place-items-center text-icon-tertiary hover:text-icon-secondary transition-colors"
          aria-label="View image in full screen"
        >
          <Maximize className="size-3" />
        </button>
      </Tooltip>
    </>
  );
}
