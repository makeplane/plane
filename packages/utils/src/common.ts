import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// Support email can be configured by the application
export const getSupportEmail = (defaultEmail: string = ""): string => defaultEmail;

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));
