import { FC } from "react";
import { useTheme } from "next-themes";
// hooks
import { useEventTracker, useUser } from "hooks/store";
// components
import { getEmptyStateImagePath } from "components/empty-state";
// constants
import { EUserWorkspaceRoles } from "constants/workspace";

// types
import { TPageNavigationTabs } from "@plane/types";

type TPageEmptyState = {
  pageType: TPageNavigationTabs;
  title?: string;
  description?: string;
  callback?: () => void;
};

export const PageEmptyState: FC<TPageEmptyState> = (props) => {
  const { title = "No pages", description = "No pages are available.", callback } = props;
  // theme
  const { resolvedTheme } = useTheme();
  // hooks
  const { currentUser } = useUser();

  const isLightMode = resolvedTheme ? resolvedTheme === "light" : currentUser?.theme.theme === "light";

  return (
    <div className="relative w-full h-full flex flex-col justify-center items-center gap-2 text-center">
      {/* replace hello with images */}
      <div className="w-full h-full max-w-40 max-h-40 relative flex justify-center items-center">Hello</div>
      <div className="space-y-1">
        <div className="text-xl">{title}</div>
        <div className="text-sm text-custom-text-200">{description}</div>
      </div>
    </div>
  );
};
