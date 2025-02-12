import { useTheme } from "next-themes";

type AssetPathConfig = {
  basePath: string;
  additionalPath?: string;
  extension?: string;
  includeThemeInPath?: boolean;
};

export const useResolvedAssetPath = ({
  basePath,
  additionalPath = "",
  extension = "webp",
  includeThemeInPath = true,
}: AssetPathConfig) => {
  // hooks
  const { resolvedTheme } = useTheme();
  // resolved theme
  const theme = resolvedTheme === "light" ? "light" : "dark";

  if (!includeThemeInPath) {
    return `${additionalPath && additionalPath !== "" ? `${basePath}${additionalPath}` : basePath}.${extension}`;
  }

  return `${additionalPath && additionalPath !== "" ? `${basePath}${additionalPath}` : basePath}-${theme}.${extension}`;
};
