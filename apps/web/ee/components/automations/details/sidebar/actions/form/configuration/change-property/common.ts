import { cn } from "@plane/utils";

export const getPropertyChangeDropdownClassNames = (isDisabled: boolean) => {
  const dropdownButtonClassName = cn("w-full px-4 py-1.5", {
    "bg-custom-background-80": isDisabled,
  });
  const errorClassName = "border-[0.5px] border-red-400";

  return {
    dropdownButtonClassName,
    errorClassName,
  };
}