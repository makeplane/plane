/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { FullScreenOutline } from "@makeplane/propel/icons";
import { useEffect, useRef, useState } from "react";
// plane imports
import { Icon } from "@makeplane/propel/components/icon";
import { ToolbarButton } from "@makeplane/propel/elements/toolbar";
import { Tooltip } from "@makeplane/propel/components/tooltip";
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
  isTouchDevice: boolean;
  toggleToolbarViewStatus: (val: boolean) => void;
};

export function ImageFullScreenActionRoot(props: Props) {
  const { image, isTouchDevice, toggleToolbarViewStatus } = props;
  const openerRef = useRef<HTMLButtonElement>(null);
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
        openerRef={openerRef}
        aspectRatio={aspectRatio}
        downloadSrc={downloadSrc}
        isFullScreenEnabled={isFullScreenEnabled}
        isTouchDevice={isTouchDevice}
        src={src}
        width={width}
        toggleFullScreenMode={setIsFullScreenEnabled}
      />
      <Tooltip label="View in full screen" disabled={isTouchDevice}>
        <ToolbarButton
          ref={openerRef}
          type="button"
          size="sm"
          labeled={false}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsFullScreenEnabled(true);
          }}
          aria-label="View image in full screen"
        >
          <Icon icon={FullScreenOutline} />
        </ToolbarButton>
      </Tooltip>
    </>
  );
}
