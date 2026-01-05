import { observer } from "mobx-react";
import { useParams, usePathname } from "next/navigation";
import { useTheme } from "next-themes";
// plane imports
import { useTranslation } from "@plane/i18n";
import type { THomeWidgetKeys, THomeWidgetProps } from "@plane/types";
// assets
import darkWidgetsAsset from "@/app/assets/empty-state/dashboard/widgets-dark.webp?url";
import lightWidgetsAsset from "@/app/assets/empty-state/dashboard/widgets-light.webp?url";
// components
import { SimpleEmptyState } from "@/components/empty-state/simple-empty-state-root";
// hooks
import { useHome } from "@/hooks/store/use-home";
import { useProject } from "@/hooks/store/use-project";
// plane web components
import { HomePageHeader } from "@/plane-web/components/home/header";
// local imports
import { StickiesWidget } from "../stickies/widget";
import { HomeLoader, NoProjectsEmptyState, RecentActivityWidget } from "./widgets";
import { DashboardQuickLinks } from "./widgets/links";
import { ManageWidgetsModal } from "./widgets/manage";

export const HOME_WIDGETS_LIST: {
  [key in THomeWidgetKeys]: {
    component: React.FC<THomeWidgetProps> | null;
    fullWidth: boolean;
    title: string;
  };
} = {
  quick_links: {
    component: DashboardQuickLinks,
    fullWidth: false,
    title: "home.quick_links.title_plural",
  },
  recents: {
    component: RecentActivityWidget,
    fullWidth: false,
    title: "home.recents.title",
  },
  my_stickies: {
    component: StickiesWidget,
    fullWidth: false,
    title: "stickies.title",
  },
  new_at_plane: {
    component: null,
    fullWidth: false,
    title: "home.new_at_plane.title",
  },
  quick_tutorial: {
    component: null,
    fullWidth: false,
    title: "home.quick_tutorial.title",
  },
};

export const DashboardWidgets = observer(function DashboardWidgets() {
  // router
  const { workspaceSlug } = useParams();
  // navigation
  const pathname = usePathname();
  // theme hook
  const { resolvedTheme } = useTheme();
  // store hooks
  const { toggleWidgetSettings, widgetsMap, showWidgetSettings, orderedWidgets, isAnyWidgetEnabled, loading } =
    useHome();
  const { loader } = useProject();
  // plane hooks
  const { t } = useTranslation();
  // derived values
  const noWidgetsResolvedPath = resolvedTheme === "light" ? lightWidgetsAsset : darkWidgetsAsset;

  // derived values
  const isWikiApp = pathname.includes(`/${workspaceSlug.toString()}/pages`);
  if (!workspaceSlug) return null;
  if (loading || loader !== "loaded") return <HomeLoader />;

  return (
    <div className="h-full w-full relative flex flex-col gap-7">
      <HomePageHeader />
      <ManageWidgetsModal
        workspaceSlug={workspaceSlug.toString()}
        isModalOpen={showWidgetSettings}
        handleOnClose={() => toggleWidgetSettings(false)}
      />
      {!isWikiApp && <NoProjectsEmptyState />}

      {isAnyWidgetEnabled ? (
        <div className="flex flex-col">
          {orderedWidgets.map((key) => {
            const WidgetComponent = HOME_WIDGETS_LIST[key]?.component;
            const isEnabled = widgetsMap[key]?.is_enabled;
            if (!WidgetComponent || !isEnabled) return null;
            return (
              <div key={key} className="py-4">
                <WidgetComponent workspaceSlug={workspaceSlug.toString()} />
              </div>
            );
          })}
        </div>
      ) : (
        <div className="h-full w-full grid place-items-center">
          <SimpleEmptyState
            title={t("home.empty.widgets.title")}
            description={t("home.empty.widgets.description")}
            assetPath={noWidgetsResolvedPath}
          />
        </div>
      )}
    </div>
  );
});
