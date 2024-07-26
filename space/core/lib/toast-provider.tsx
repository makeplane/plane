"use client";

import { ReactNode } from "react";
import { useTheme } from "next-themes"
// ui
import { Toast } from "@plane/ui";
// helpers
import { resolveGeneralTheme } from "@/helpers/common.helper";

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
