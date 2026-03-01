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

import { useRef, useEffect, forwardRef, useImperativeHandle } from "react";
import { cn } from "@plane/utils";

type DrawioIframeProps = {
  src: string;
  onMessage?: (event: MessageEvent) => void;
  isVisible?: boolean;
};

export type DrawioIframeRef = {
  postMessage: (message: string) => void;
  showIframe: () => void;
  hideIframe: () => void;
};

export const DrawioIframe = forwardRef(function DrawioIframe(
  { src, onMessage, isVisible = false }: DrawioIframeProps,
  ref: React.ForwardedRef<DrawioIframeRef>
) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (onMessage) {
      window.addEventListener("message", onMessage);
      return () => {
        window.removeEventListener("message", onMessage);
      };
    }
  }, [onMessage]);

  useImperativeHandle(ref, () => ({
    postMessage: (message: string) => {
      iframeRef.current?.contentWindow?.postMessage(message, "*");
    },
    showIframe: () => {
      if (iframeRef.current?.style) iframeRef.current.style.opacity = "1";
    },
    hideIframe: () => {
      if (iframeRef.current?.style) iframeRef.current.style.opacity = "0";
    },
  }));

  return (
    <iframe
      ref={iframeRef}
      src={src}
      title="Drawio diagram editor"
      className={cn(
        "w-full h-full border-none rounded-xl transition-opacity duration-300",
        isVisible ? "opacity-100" : "opacity-0"
      )}
    />
  );
});

DrawioIframe.displayName = "DrawioIframe";
