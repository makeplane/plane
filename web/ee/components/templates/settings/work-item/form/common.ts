import { cn } from "@/helpers/common.helper";

export const COMMON_BUTTON_CLASS_NAME = "bg-custom-background-100 shadow-sm rounded";
export const PARENT_BUTTON_CLASS_NAME = cn(
  "flex cursor-pointer items-center justify-between gap-1 h-full border-[0.5px] border-custom-border-300 px-2 py-0.5 text-xs hover:bg-custom-background-80",
  COMMON_BUTTON_CLASS_NAME
);
export const COMMON_ERROR_CLASS_NAME = "border-[0.5px] border-red-400";

export const validateWhitespace = (value: string) => {
  if (value.trim() === "") {
    return "title_is_required";
  }
  return undefined;
};
