import { useCallback } from "react";

type TUseDropdownKeyPressed = {
  (
    onEnterKeyDown: () => void,
    onEscKeyDown: () => void,
    stopPropagation?: boolean
  ): (event: React.KeyboardEvent<HTMLElement>) => void;
};

export const useDropdownKeyPressed: TUseDropdownKeyPressed = (onEnterKeyDown, onEscKeyDown, stopPropagation = true) => {
  const stopEventPropagation = useCallback(
    (event: React.KeyboardEvent<HTMLElement>) => {
      if (stopPropagation) {
        event.stopPropagation();
        event.preventDefault();
      }
    },
    [stopPropagation]
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLElement>) => {
      if (event.key === "Enter") {
        stopEventPropagation(event);
        onEnterKeyDown();
      } else if (event.key === "Escape") {
        stopEventPropagation(event);
        onEscKeyDown();
      } else if (event.key === "Tab") onEscKeyDown();
    },
    [onEnterKeyDown, onEscKeyDown, stopEventPropagation]
  );

  return handleKeyDown;
};
