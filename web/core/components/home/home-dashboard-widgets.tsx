import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// types
import { THomeWidgetKeys, THomeWidgetProps } from "@plane/types";
// hooks
import { useHome } from "@/hooks/store/use-home";
// components
import { HomePageHeader } from "@/plane-web/components/home/header";
import { StickiesWidget } from "@/plane-web/components/stickies";
import { RecentActivityWidget } from "./widgets";
import { DashboardQuickLinks } from "./widgets/links";
import { ManageWidgetsModal } from "./widgets/manage";

const WIDGETS_LIST: {
  [key in THomeWidgetKeys]: { component: React.FC<THomeWidgetProps>; fullWidth: boolean };
} = {
  quick_links: { component: DashboardQuickLinks, fullWidth: false },
  recent_activity: { component: RecentActivityWidget, fullWidth: false },
  stickies: { component: StickiesWidget, fullWidth: false },
};

export const DashboardWidgets = observer(() => {
  // router
  const { workspaceSlug } = useParams();
  // store hooks
  const { toggleWidgetSettings, showWidgetSettings } = useHome();

  if (!workspaceSlug) return null;

  return (
    <div className="relative flex flex-col gap-7">
      <HomePageHeader />
      <ManageWidgetsModal
        workspaceSlug={workspaceSlug.toString()}
        isModalOpen={showWidgetSettings}
        handleOnClose={() => toggleWidgetSettings(false)}
      />

      {Object.entries(WIDGETS_LIST).map(([key, widget]) => {
        const WidgetComponent = widget.component;
        if (widget.fullWidth)
          return (
            <div key={key} className="lg:col-span-2">
              <WidgetComponent workspaceSlug={workspaceSlug.toString()} />
            </div>
          );
        else return <WidgetComponent key={key} workspaceSlug={workspaceSlug.toString()} />;
      })}
    </div>
  );
});
