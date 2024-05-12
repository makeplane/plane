import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

export const ADMIN_BASE_URL = process.env.NEXT_PUBLIC_ADMIN_BASE_URL ?? "";
export const ADMIN_BASE_PATH = process.env.NEXT_PUBLIC_ADMIN_BASE_PATH ?? "";

export const WEB_BASE_URL = process.env.NEXT_PUBLIC_WEB_BASE_URL ?? "";

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));
