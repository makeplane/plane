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

import katex from "katex";
import { useEffect, useRef } from "react";
// utils
import { ensureKaTeXStyles } from "../utils/katex-styles";

type UseMathRendererOptions = {
  displayMode?: boolean;
  throwOnError?: boolean;
};

export const useMathRenderer = <T extends HTMLElement = HTMLElement>(
  latex: string,
  options: UseMathRendererOptions = {}
) => {
  const mathRef = useRef<T>(null);
  const { displayMode = false, throwOnError = false } = options;

  useEffect(() => {
    let isDisposed = false;

    const renderMath = async () => {
      if (!mathRef.current) return;

      // Ensure KaTeX styles are loaded before rendering.
      await ensureKaTeXStyles();

      if (!mathRef.current || isDisposed) return;

      katex.render(latex, mathRef.current, {
        displayMode,
        throwOnError,
        strict: "warn", // Allow more LaTeX constructs
      });
    };

    void renderMath();

    return () => {
      isDisposed = true;
    };
  }, [displayMode, latex, throwOnError]);

  return { mathRef };
};
