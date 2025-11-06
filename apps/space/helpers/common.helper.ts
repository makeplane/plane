export const SUPPORT_EMAIL = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "";

export const resolveGeneralTheme = (resolvedTheme: string | undefined) =>
  resolvedTheme?.includes("light") ? "light" : resolvedTheme?.includes("dark") ? "dark" : "system";
