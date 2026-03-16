/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useLayoutEffect } from "react";

export const useAutoResizeTextArea = (
  textAreaRef: React.RefObject<HTMLTextAreaElement>,
  value: string | number | readonly string[]
) => {
  useLayoutEffect(() => {
    const textArea = textAreaRef.current;
    if (!textArea) return;

    // We need to reset the height momentarily to get the correct scrollHeight for the textarea
    textArea.style.height = "0px";
    const scrollHeight = textArea.scrollHeight;
    textArea.style.height = scrollHeight + "px";
  }, [textAreaRef, value]);
};
