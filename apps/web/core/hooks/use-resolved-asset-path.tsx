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
  // resolved asset path
  const resolvedBasePath = `/app/assets${basePath}`;

  let path: string;

  if (!includeThemeInPath) {
    path = `${additionalPath && additionalPath !== "" ? `${resolvedBasePath}${additionalPath}` : resolvedBasePath}.${extension}`;
  } else {
    path = `${additionalPath && additionalPath !== "" ? `${resolvedBasePath}${additionalPath}` : resolvedBasePath}-${theme}.${extension}`;
  }

  return `${path}?url`;
};
