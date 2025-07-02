export const COMMON_BUTTON_CLASS_NAME = "bg-custom-background-100 shadow-sm rounded";
export const COMMON_ERROR_CLASS_NAME = "border-[0.5px] border-red-400";
export const COMMON_LABEL_TEXT_CLASS_NAME = "text-xs font-medium text-custom-text-300";
export const COMMON_ERROR_TEXT_CLASS_NAME = "text-xs font-medium text-red-500";

export const validateWhitespaceI18n = (value: string) => {
  if (value.trim() === "") {
    return "common.errors.required";
  }
  return undefined;
};
