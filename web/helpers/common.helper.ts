import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "";

export const ADMIN_BASE_URL = process.env.NEXT_PUBLIC_ADMIN_BASE_URL || "";
export const ADMIN_BASE_PATH = process.env.NEXT_PUBLIC_ADMIN_BASE_PATH || "";

export const SPACE_BASE_URL = process.env.NEXT_PUBLIC_SPACE_BASE_URL || "";
export const SPACE_BASE_PATH = process.env.NEXT_PUBLIC_SPACE_BASE_PATH || "";

export const LIVE_BASE_URL = process.env.NEXT_PUBLIC_LIVE_BASE_URL || "";
export const LIVE_BASE_PATH = process.env.NEXT_PUBLIC_LIVE_BASE_PATH || "";
export const LIVE_URL = `${LIVE_BASE_URL}${LIVE_BASE_PATH}`;

export const SUPPORT_EMAIL = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "";

export const GOD_MODE_URL = encodeURI(`${ADMIN_BASE_URL}${ADMIN_BASE_PATH}/`);

export const debounce = (func: any, wait: number, immediate: boolean = false) => {
  let timeout: any;

  return function executedFunction(...args: any) {
    const later = () => {
      timeout = null;
      if (!immediate) func(...args);
    };

    const callNow = immediate && !timeout;

    clearTimeout(timeout);

    timeout = setTimeout(later, wait);

    if (callNow) func(...args);
  };
};

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));
