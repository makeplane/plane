"use client";

import { useTheme } from "next-themes";
import { Toast } from "@plane/ui";
import { resolveGeneralTheme } from "@plane/utils";

export const ToastWithTheme = () => {
  const { resolvedTheme } = useTheme();
  return <Toast theme={resolveGeneralTheme(resolvedTheme)} />;
};
