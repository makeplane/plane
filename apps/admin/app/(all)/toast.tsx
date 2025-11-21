import { useTheme } from "next-themes";
import { Toast } from "@plane/propel/toast";
import { resolveGeneralTheme } from "@plane/utils";

export function ToastWithTheme() {
  const { resolvedTheme } = useTheme();
  return <Toast theme={resolveGeneralTheme(resolvedTheme)} />;
}
