import { useCallback } from "react";

type TUseDropdownKeyDown = {
  (onEnterKeyDown: () => void, onEscKeyDown: () => void, stopPropagation?: boolean): (
    event: React.KeyboardEvent<HTMLElement>
  ) => void;
};

export const useDropdownKeyDown: TUseDropdownKeyDown = (onEnterKeyDown, onEscKeyDown, stopPropagation = true) => {
  const stopEventPropagation = (event: React.KeyboardEvent<HTMLElement>) => {
    if (stopPropagation) {
      event.stopPropagation();
      event.preventDefault();
    }
  };

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLElement>) => {
      if (event.key === "Enter") {
        stopEventPropagation(event);

        onEnterKeyDown();
      } else if (event.key === "Escape") {
        stopEventPropagation(event);
        onEscKeyDown();
      }
    },
    [onEnterKeyDown, onEscKeyDown, stopEventPropagation]
  );

  return handleKeyDown;
};
