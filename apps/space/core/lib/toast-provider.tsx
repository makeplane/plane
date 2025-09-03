"use client";

import { useTheme } from "next-themes";
// plane imports
import { Toast } from "@plane/ui";
import { resolveGeneralTheme } from "@plane/utils";

export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  // themes
  const { resolvedTheme } = useTheme();

  return (
    <>
      <Toast theme={resolveGeneralTheme(resolvedTheme)} />
      {children}
    </>
  );
};
