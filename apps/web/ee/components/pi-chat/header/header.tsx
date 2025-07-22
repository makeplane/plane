"use-client";

import { observer } from "mobx-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Home, PanelLeft, SquarePen } from "lucide-react";
import { useTranslation } from "@plane/i18n";
import { BetaBadge, Breadcrumbs, Header as HeaderUI, PiIcon, Row, Tooltip } from "@plane/ui";
import { cn } from "@plane/utils";
import { BreadcrumbLink } from "@/components/common";
import { AppSidebarToggleButton } from "@/components/sidebar";
import { useAppTheme } from "@/hooks/store";
import { usePiChat } from "@/plane-web/hooks/store/use-pi-chat";
import { isSidebarToggleVisible } from "../../desktop";

type THeaderProps = {
  isProjectLevel?: boolean;
  shouldRenderSidebarToggle: boolean;
  isFullScreen: boolean;
  isSidePanelOpen: boolean;
  toggleSidePanel: (value: boolean) => void;
};

const buttonClass =
  "w-auto p-2 rounded-lg text-custom-text-200 grid place-items-center border-[0.5px] border-custom-sidebar-border-300 bg-custom-background-200 hover:shadow-sm hover:text-custom-text-300";
export const Header = observer((props: THeaderProps) => {
  const router = useRouter();
  const { workspaceSlug } = useParams();
  const { isProjectLevel = false, shouldRenderSidebarToggle, isFullScreen, toggleSidePanel, isSidePanelOpen } = props;
  const { sidebarCollapsed } = useAppTheme();
  const { initPiChat } = usePiChat();
  const { t } = useTranslation();
  return (
    <Row className="h-header flex gap-2 w-full items-center border-b border-custom-border-200 bg-custom-sidebar-background-100 rounded-tl-lg rounded-tr-lg">
      <HeaderUI>
        <HeaderUI.LeftItem>
          {isSidebarToggleVisible() && sidebarCollapsed && shouldRenderSidebarToggle && <AppSidebarToggleButton />}
          <Breadcrumbs onBack={router.back}>
            {isProjectLevel && isFullScreen && (
              <Breadcrumbs.Item
                component={
                  <BreadcrumbLink
                    href={"/"}
                    label={t("home.title")}
                    icon={<Home className="h-4 w-4 text-custom-text-300" />}
                  />
                }
              />
            )}
            <Breadcrumbs.Item
              component={
                <div className="flex rounded gap-2 items-center">
                  <PiIcon className="size-4 text-custom-text-350 fill-current m-auto align-center" />
                  <span className="font-medium text-sm my-auto"> Pi Chat (GPT-4.1)</span>
                  <BetaBadge />
                </div>
              }
            />
          </Breadcrumbs>
        </HeaderUI.LeftItem>
        <HeaderUI.RightItem>
          {isProjectLevel && (
            <div className="flex gap-2">
              {isFullScreen ? (
                <Tooltip tooltipContent="Start a new chat" position="bottom">
                  <Link
                    href={`/${workspaceSlug}/${isProjectLevel ? "projects/" : ""}pi-chat/new`}
                    tabIndex={-1}
                    className={cn(buttonClass)}
                  >
                    <SquarePen className="flex-shrink-0 size-3.5" />
                  </Link>
                </Tooltip>
              ) : (
                <Tooltip tooltipContent="Start a new chat" position="left">
                  <button className={cn(buttonClass)} onClick={() => initPiChat()}>
                    <SquarePen className="flex-shrink-0 size-3.5" />
                  </button>
                </Tooltip>
              )}
              {isFullScreen && !isSidePanelOpen && (
                <Tooltip tooltipContent="History" position="bottom">
                  <button type="button" className={cn(buttonClass)} onClick={() => toggleSidePanel(true)}>
                    <PanelLeft className="size-3.5" />
                  </button>
                </Tooltip>
              )}
            </div>
          )}
        </HeaderUI.RightItem>
      </HeaderUI>
    </Row>
  );
});
