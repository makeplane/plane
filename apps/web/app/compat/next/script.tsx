/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect } from "react";

type ScriptProps = {
  src?: string;
  id?: string;
  strategy?: "beforeInteractive" | "afterInteractive" | "lazyOnload" | "worker";
  onLoad?: () => void;
  onError?: () => void;
  children?: string;
  defer?: boolean;
  [key: string]: any;
};

// Minimal shim for next/script that creates a script tag
function Script({ src, id, strategy: _strategy, onLoad, onError, children, ...rest }: ScriptProps) {
  useEffect(() => {
    if (src) {
      const script = document.createElement("script");
      if (id) script.id = id;
      script.src = src;
      if (onLoad) script.onload = onLoad;
      if (onError) script.onerror = onError;
      Object.keys(rest).forEach((key) => {
        script.setAttribute(key, rest[key]);
      });
      document.body.appendChild(script);

      return () => {
        if (script.parentNode) {
          document.body.removeChild(script);
        }
      };
    } else if (children) {
      const script = document.createElement("script");
      if (id) script.id = id;
      script.textContent = children;
      Object.keys(rest).forEach((key) => {
        script.setAttribute(key, rest[key]);
      });
      document.body.appendChild(script);

      return () => {
        if (script.parentNode) {
          document.body.removeChild(script);
        }
      };
    }
  }, [src, id, children, onLoad, onError, rest]);

  return null;
}

export default Script;
