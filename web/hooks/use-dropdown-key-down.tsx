import { useCallback } from "react";

type TUseDropdownKeyDown = {
  (onOpen: () => void, onClose: () => void, isOpen: boolean): (event: React.KeyboardEvent<HTMLElement>) => void;
};

export const useDropdownKeyDown: TUseDropdownKeyDown = (onOpen, onClose, isOpen) => {
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLElement>) => {
      if (event.key === "Enter") {
        event.stopPropagation();
        if (!isOpen) {
          onOpen();
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
