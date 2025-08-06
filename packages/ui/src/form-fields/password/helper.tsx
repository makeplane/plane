import { E_PASSWORD_STRENGTH } from "@plane/constants";

export interface StrengthInfo {
  message: string;
  textColor: string;
  activeFragments: number;
}

/**
 * Get strength information including message, color, and active fragments
 */
export const getStrengthInfo = (strength: E_PASSWORD_STRENGTH): StrengthInfo => {
  switch (strength) {
    case E_PASSWORD_STRENGTH.EMPTY:
      return {
        message: "Please enter your password",
        textColor: "text-custom-text-100",
        activeFragments: 0,
      };
    case E_PASSWORD_STRENGTH.LENGTH_NOT_VALID:
      return {
        message: "Password is too short",
        textColor: "text-red-500",
        activeFragments: 1,
      };
    case E_PASSWORD_STRENGTH.STRENGTH_NOT_VALID:
      return {
        message: "Password is weak",
        textColor: "text-orange-500",
        activeFragments: 2,
      };
    case E_PASSWORD_STRENGTH.STRENGTH_VALID:
      return {
        message: "Password is strong",
        textColor: "text-green-500",
        activeFragments: 3,
      };
    default:
      return {
        message: "Please enter your password",
        textColor: "text-custom-text-100",
        activeFragments: 0,
      };
  }
};

/**
 * Get fragment color based on position and active state
 */
export const getFragmentColor = (fragmentIndex: number, activeFragments: number): string => {
  if (fragmentIndex >= activeFragments) {
    return "bg-custom-background-80";
  }

  switch (activeFragments) {
    case 1:
      return "bg-red-500";
    case 2:
      return "bg-orange-500";
    case 3:
      return "bg-green-500";
    default:
      return "bg-custom-background-80";
  }
};
