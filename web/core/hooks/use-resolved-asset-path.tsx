import { useTheme } from "next-themes";

type AssetPathConfig = {
  basePath: string;
  additionalPath?: string;
  extension?: string;
};

export const useResolvedAssetPath = ({ basePath, additionalPath = "", extension = "webp" }: AssetPathConfig) => {
  // hooks
  const { resolvedTheme } = useTheme();

  // resolved theme
  const theme = resolvedTheme === "light" ? "light" : "dark";

  return `${additionalPath && additionalPath !== "" ? `${basePath}${additionalPath}` : basePath}-${theme}.${extension}`;
};
