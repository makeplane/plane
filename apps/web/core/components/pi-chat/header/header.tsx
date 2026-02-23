/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { observer } from "mobx-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { History, SquarePen } from "lucide-react";
import { useTranslation } from "@plane/i18n";
// plane imports
import { HomeIcon, PiIcon } from "@plane/propel/icons";
import { Tooltip } from "@plane/propel/tooltip";
import { Breadcrumbs, Header as HeaderUI } from "@plane/ui";
import { BreadcrumbLink } from "@/components/common/breadcrumb-link";
import { AppHeader } from "@/components/core/app-header";
import { usePiChat } from "@/plane-web/hooks/store/use-pi-chat";
import { BetaBadge } from "@/components/common/beta";
import { ModelsDropdown } from "./models-dropdown";
import { AiSidecarQuickActions } from "./quick-actions";
import { IconButton } from "@plane/propel/icon-button";

type THeaderProps = {
  isProjectLevel?: boolean;
  shouldRenderSidebarToggle: boolean;
  isFullScreen: boolean;
  isSidePanelOpen: boolean;
  toggleSidePanel: (value: boolean) => void;
};
export const Header = observer(function Header(props: THeaderProps) {
  const router = useRouter();
  const { workspaceSlug } = useParams();
  const { isProjectLevel = false, isFullScreen, toggleSidePanel, isSidePanelOpen } = props;
  const { initPiChat, activeChatId, activeModel, models, setActiveModel } = usePiChat();
  const { t } = useTranslation();
  return (
    <AppHeader
      header={
        <HeaderUI>
          <HeaderUI.LeftItem className="flex items-center gap-2">
            <Breadcrumbs onBack={router.back}>
              {isProjectLevel && isFullScreen && (
                <Breadcrumbs.Item
                  component={
                    <BreadcrumbLink
                      href={"/"}
                      label={t("home.title")}
                      icon={<HomeIcon className="h-4 w-4 text-tertiary" />}
                    />
                  }
                />
              )}
              <Breadcrumbs.Item
                component={
                  <div className="flex rounded-sm gap-2 items-center">
                    {isFullScreen && <PiIcon className="size-4 text-icon-primary fill-current m-auto align-center" />}
                    {models?.length > 1 ? (
                      <ModelsDropdown
                        models={models}
                        activeModel={activeModel}
                        setActiveModel={(model) => setActiveModel(activeChatId, model)}
                      />
                    ) : (
                      <span className="text-body-xs-medium text-secondary my-auto">Plane AI</span>
                    )}
                    <BetaBadge />
                  </div>
                }
              />
            </Breadcrumbs>
          </HeaderUI.LeftItem>
          <HeaderUI.RightItem>
            {isProjectLevel && (
              <div className="flex gap-2">
                <>
                  {!isFullScreen ? (
                    <Tooltip tooltipContent="Start a new chat" position="left">
                      <IconButton size="lg" variant={"tertiary"} icon={SquarePen} onClick={() => initPiChat()} />
                    </Tooltip>
                  ) : (
                    <Tooltip tooltipContent="Start a new chat" position="bottom">
                      <Link
                        href={`/${workspaceSlug}/${isProjectLevel ? "projects/" : ""}ai-chat`}
                        tabIndex={-1}
                        className="bg-layer-1 rounded-md px-2 py-[0.5px] h-7 text-icon-tertiary flex items-center justify-center hover:bg-layer-1-hover"
                      >
                        <SquarePen className="flex-shrink-0 size-4" />
                      </Link>
                    </Tooltip>
                  )}
                  {!isSidePanelOpen && (
                    <Tooltip tooltipContent="History" position="bottom">
                      <IconButton size="lg" variant={"tertiary"} icon={History} onClick={() => toggleSidePanel(true)} />
                    </Tooltip>
                  )}

                  {!isFullScreen && (
                    <AiSidecarQuickActions
                      workspaceSlug={workspaceSlug}
                      chatId={activeChatId}
                      initPiChat={initPiChat}
                    />
                  )}
                </>
              </div>
            )}
          </HeaderUI.RightItem>
        </HeaderUI>
      }
    />
  );
});
