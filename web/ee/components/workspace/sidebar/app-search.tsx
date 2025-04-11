import { observer } from "mobx-react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { Search } from "lucide-react";
// ce imports
import { AppSearch as BaseAppSearch } from "@/ce/components/workspace/sidebar/app-search";
// helpers
import { cn } from "@/helpers/common.helper";
// hooks
import { useAppTheme } from "@/hooks/store";
// plane web imports
import { WithFeatureFlagHOC } from "@/plane-web/components/feature-flags";

export const AppSearch = observer(() => {
  // router
  const { workspaceSlug } = useParams();
  const pathname = usePathname();
  // store hooks
  const { sidebarCollapsed } = useAppTheme();
  // derived values
  const isOnSearchPage = pathname.includes(`${workspaceSlug}/search`);

  return (
    <WithFeatureFlagHOC workspaceSlug={workspaceSlug?.toString()} flag="ADVANCED_SEARCH" fallback={<BaseAppSearch />}>
      <Link
        href={`/${workspaceSlug}/search`}
        className={cn(
          "flex-shrink-0 size-8 aspect-square grid place-items-center rounded hover:bg-custom-sidebar-background-90 outline-none",
          {
            "border-[0.5px] border-custom-sidebar-border-300": !sidebarCollapsed,
            "bg-custom-primary-100/10 hover:bg-custom-primary-100/10 border-custom-primary-200": isOnSearchPage,
          }
        )}
      >
        <Search
          className={cn("size-4 text-custom-sidebar-text-300", {
            "text-custom-primary-200": isOnSearchPage,
          })}
        />
      </Link>
    </WithFeatureFlagHOC>
  );
});
