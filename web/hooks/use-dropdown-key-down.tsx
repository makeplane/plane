import { useCallback } from "react";

type TUseDropdownKeyDown = {
  (onEnterKeyDown: () => void, onEscKeyDown: () => void): (event: React.KeyboardEvent<HTMLElement>) => void;
};

export const useDropdownKeyDown: TUseDropdownKeyDown = (onEnterKeyDown, onEscKeyDown) => {
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLElement>) => {
      if (event.key === "Enter") {
        event.stopPropagation();
        event.preventDefault();
        onEnterKeyDown();
      } else if (event.key === "Escape") {
        event.stopPropagation();
        event.preventDefault();
        onEscKeyDown();
      }
    },
    [onEnterKeyDown, onEscKeyDown]
  );

  return handleKeyDown;
};
