import { useTheme } from "next-themes";
// plane imports
import { Toast } from "@plane/propel/toast";
import { resolveGeneralTheme } from "@plane/utils";

export function ToastProvider({ children }: { children: React.ReactNode }) {
  // themes
  const { resolvedTheme } = useTheme();

  return (
    <>
      <Toast theme={resolveGeneralTheme(resolvedTheme)} />
      {children}
    </>
  );
}
