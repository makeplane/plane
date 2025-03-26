import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export const SUPPORT_EMAIL = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "";

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

export const resolveGeneralTheme = (resolvedTheme: string | undefined) =>
  resolvedTheme?.includes("light") ? "light" : resolvedTheme?.includes("dark") ? "dark" : "system";

export const TERMS_URL = process.env.NEXT_PUBLIC_TERMS_URL || "https://plane.so/legals/terms-and-conditions";

export const PRIVACY_URL = process.env.NEXT_PUBLIC_PRIVACY_URL || "https://plane.so/legals/privacy-policy";
