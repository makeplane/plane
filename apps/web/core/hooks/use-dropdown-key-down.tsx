import { useCallback } from "react";

type TUseDropdownKeyDown = {
  (
    onEnterKeyDown: () => void,
    onEscKeyDown: () => void,
    stopPropagation?: boolean
  ): (event: React.KeyboardEvent<HTMLElement>) => void;
};

export const useDropdownKeyDown: TUseDropdownKeyDown = (onEnterKeyDown, onEscKeyDown, stopPropagation = true) => {
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
      if (event.key === "Enter" && !event.nativeEvent.isComposing) {
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
