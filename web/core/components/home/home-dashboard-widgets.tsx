import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// types
import { THomeWidgetKeys, THomeWidgetProps } from "@plane/types";
// hooks
import { useHome } from "@/hooks/store/use-home";
// components
import { HomePageHeader } from "@/plane-web/components/home/header";
import { StickiesWidget } from "../stickies";
import { RecentActivityWidget } from "./widgets";
import { DashboardQuickLinks } from "./widgets/links";
import { ManageWidgetsModal } from "./widgets/manage";

const WIDGETS_LIST: {
  [key in THomeWidgetKeys]: { component: React.FC<THomeWidgetProps> | null; fullWidth: boolean };
} = {
  quick_links: { component: DashboardQuickLinks, fullWidth: false },
  recents: { component: RecentActivityWidget, fullWidth: false },
  my_stickies: { component: StickiesWidget, fullWidth: false },
  new_at_plane: { component: null, fullWidth: false },
  quick_tutorial: { component: null, fullWidth: false },
};

export const DashboardWidgets = observer(() => {
  // router
  const { workspaceSlug } = useParams();
  // store hooks
  const { toggleWidgetSettings, widgetsMap, showWidgetSettings, orderedWidgets } = useHome();

  if (!workspaceSlug) return null;

  return (
    <div className="relative flex flex-col gap-7">
      <HomePageHeader />
      <ManageWidgetsModal
        workspaceSlug={workspaceSlug.toString()}
        isModalOpen={showWidgetSettings}
        handleOnClose={() => toggleWidgetSettings(false)}
      />
      <div className="flex flex-col divide-y-[1px] divide-custom-border-100">
        {orderedWidgets.map((key) => {
          const WidgetComponent = WIDGETS_LIST[key]?.component;
          const isEnabled = widgetsMap[key]?.is_enabled;
          if (!WidgetComponent || !isEnabled) return null;
          return (
            <div key={key} className="py-4">
              <WidgetComponent workspaceSlug={workspaceSlug.toString()} />
            </div>
          );
        })}
      </div>
    </div>
  );
});
