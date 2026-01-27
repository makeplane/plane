/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useCallback } from "react";

type TUseDropdownKeyDown = {
  (
    onOpen: () => void,
    onClose: () => void,
    isOpen: boolean,
    selectActiveItem?: () => void
  ): (event: React.KeyboardEvent<HTMLElement>) => void;
};

export const useDropdownKeyDown: TUseDropdownKeyDown = (onOpen, onClose, isOpen, selectActiveItem?) => {
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLElement>) => {
      if (event.key === "Enter" && !event.nativeEvent.isComposing) {
        if (!isOpen) {
          event.stopPropagation();
          onOpen();
        } else {
          selectActiveItem && selectActiveItem();
        }
      } else if (event.key === "Escape" && isOpen) {
        event.stopPropagation();
        onClose();
      }
    },
    [isOpen, onOpen, onClose]
  );

  return handleKeyDown;
};
