import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane types
import { THomeWidgetKeys, THomeWidgetProps } from "@plane/types";
// components
import { EmptyState } from "@/components/empty-state";
// constants
import { EmptyStateType } from "@/constants/empty-state";
// hooks
import { useHome } from "@/hooks/store/use-home";
// plane web components
import { HomePageHeader } from "@/plane-web/components/home/header";
import { StickiesWidget } from "../stickies";
import { RecentActivityWidget } from "./widgets";
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
    title: "Quick links",
  },
  recents: {
    component: RecentActivityWidget,
    fullWidth: false,
    title: "Recents",
  },
  my_stickies: {
    component: StickiesWidget,
    fullWidth: false,
    title: "Your stickies",
  },
  new_at_plane: {
    component: null,
    fullWidth: false,
    title: "New at Plane",
  },
  quick_tutorial: {
    component: null,
    fullWidth: false,
    title: "Quick tutorial",
  },
};

export const DashboardWidgets = observer(() => {
  // router
  const { workspaceSlug } = useParams();
  // store hooks
  const { toggleWidgetSettings, widgetsMap, showWidgetSettings, orderedWidgets, isAnyWidgetEnabled } = useHome();

  if (!workspaceSlug) return null;

  return (
    <div className="h-full w-full relative flex flex-col gap-7">
      <HomePageHeader />
      <ManageWidgetsModal
        workspaceSlug={workspaceSlug.toString()}
        isModalOpen={showWidgetSettings}
        handleOnClose={() => toggleWidgetSettings(false)}
      />
      {isAnyWidgetEnabled ? (
        <div className="flex flex-col divide-y-[1px] divide-custom-border-100">
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
          <EmptyState
            type={EmptyStateType.HOME_WIDGETS}
            layout="screen-simple"
            primaryButtonOnClick={() => toggleWidgetSettings(true)}
            primaryButtonConfig={{
              size: "sm",
              variant: "neutral-primary",
            }}
          />
        </div>
      )}
    </div>
  );
});
