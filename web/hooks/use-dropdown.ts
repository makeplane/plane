import { useEffect } from "react";
// hooks
import { useDropdownKeyDown } from "@/hooks/use-dropdown-key-down";
import useOutsideClickDetector from "@/hooks/use-outside-click-detector";

type TArguments = {
  dropdownRef: React.RefObject<HTMLDivElement>;
  inputRef?: React.RefObject<HTMLInputElement | null>;
  isOpen: boolean;
  onClose?: () => void;
  onOpen?: () => Promise<void> | void;
  query?: string;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setQuery?: React.Dispatch<React.SetStateAction<string>>;
};

export const useDropdown = (args: TArguments) => {
  const { dropdownRef, inputRef, isOpen, onClose, onOpen, query, setIsOpen, setQuery } = args;

  /**
   * @description clear the search input when the user presses the escape key, if the search input is not empty
   * @param {React.KeyboardEvent<HTMLInputElement>} e
   */
  const searchInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (query !== "" && e.key === "Escape") {
      e.stopPropagation();
      setQuery?.("");
    }
  };

  /**
   * @description close the dropdown, clear the search input, and call the onClose callback
   */
  const handleClose = () => {
    if (!isOpen) return;
    setIsOpen(false);
    onClose?.();
    setQuery?.("");
  };

  // toggle the dropdown, call the onOpen callback if the dropdown is closed, and call the onClose callback if the dropdown is open
  const toggleDropdown = () => {
    if (!isOpen) onOpen?.();
    setIsOpen((prevIsOpen) => !prevIsOpen);
    if (isOpen) onClose?.();
  };

  const handleKeyDown = useDropdownKeyDown(toggleDropdown, handleClose);

  /**
   * @description toggle the dropdown on click
   * @param {React.MouseEvent<HTMLButtonElement, MouseEvent>} e
   */
  const handleOnClick = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    e.stopPropagation();
    e.preventDefault();
    toggleDropdown();
  };

  // close the dropdown when the user clicks outside of the dropdown
  useOutsideClickDetector(dropdownRef, handleClose);

  // focus the search input when the dropdown is open
  useEffect(() => {
    if (isOpen && inputRef?.current) {
      inputRef.current.focus();
    }
  }, [inputRef, isOpen]);

  return {
    handleClose,
    handleKeyDown,
    handleOnClick,
    searchInputKeyDown,
  };
};
