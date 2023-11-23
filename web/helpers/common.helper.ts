import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

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

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ? process.env.NEXT_PUBLIC_API_BASE_URL : "";

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));
