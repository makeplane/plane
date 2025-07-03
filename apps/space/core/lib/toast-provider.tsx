"use client";

import { ReactNode } from "react";
import { useTheme } from "next-themes";
// plane imports
import { Toast } from "@plane/ui";
import { resolveGeneralTheme } from "@plane/utils";

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  // themes
  const { resolvedTheme } = useTheme();

  return (
    <>
      <Toast theme={resolveGeneralTheme(resolvedTheme)} />
      {children}
    </>
  );
};
