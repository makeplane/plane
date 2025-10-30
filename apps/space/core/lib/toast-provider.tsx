"use client";

import type { ReactNode } from "react";
import { useTheme } from "next-themes";
// plane imports
import { Toast } from "@plane/propel/toast";
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
