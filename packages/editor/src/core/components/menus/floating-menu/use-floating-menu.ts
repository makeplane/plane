import {
  shift,
  flip,
  useDismiss,
  useFloating,
  useInteractions,
  autoUpdate,
  useClick,
  useRole,
} from "@floating-ui/react";
import { useState } from "react";

type TArgs = {
  handleOpenChange?: (open: boolean) => void;
};

export const useFloatingMenu = (args: TArgs) => {
  const { handleOpenChange } = args;
  // states
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  // floating ui
  const options = useFloating({
    placement: "bottom-start",
    middleware: [
      flip({
        fallbackPlacements: ["top-start", "bottom-start", "top-end", "bottom-end"],
      }),
      shift({
        padding: 8,
      }),
    ],
    open: isDropdownOpen,
    onOpenChange: (open) => {
      setIsDropdownOpen(open);
      handleOpenChange?.(open);
    },
    whileElementsMounted: autoUpdate,
  });
  const { context } = options;
  const click = useClick(context);
  const dismiss = useDismiss(context);
  const role = useRole(context);
  const { getReferenceProps, getFloatingProps } = useInteractions([dismiss, click, role]);

  return {
    options,
    getReferenceProps,
    getFloatingProps,
  };
};
