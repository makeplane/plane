import { useTheme } from "next-themes";
// ui
import { Toast as ToastComponent } from "@plane/ui";
// helpers
import { resolveGeneralTheme } from "@/helpers/common.helper";

export const Toast = () => {
  const { theme } = useTheme();

  return <ToastComponent theme={resolveGeneralTheme(theme)} />;
};
