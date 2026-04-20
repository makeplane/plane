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

import { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Transition } from "@headlessui/react";
import { observer } from "mobx-react";
import { EProductSubscriptionEnum } from "@plane/types";
import type { TExploredFeatures } from "@plane/types";
import { IconButton } from "@plane/propel/icon-button";
import { ChevronRightIcon, GithubIcon, SlackIcon, PiIcon, CloseIcon } from "@plane/propel/icons";
import { cn } from "@plane/utils";
import { SidebarNavItem } from "@/components/sidebar/sidebar-navigation";
import { useWorkspacePreferences } from "@/hooks/store/use-workspace-preferences";
import { useWorkspaceSubscription } from "@/plane-web/hooks/store/use-workspace-subscription";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@plane/propel/collapsible";

type TTrySectionItem = {
  title: string;
  icon: React.ReactNode;
  feature: TExploredFeatures;
  getHref: (workspaceSlug: string) => string;
};

export const SidebarTrySection = observer(() => {
  const [isOpen, setIsOpen] = useState(true);
  const { workspaceSlug } = useParams();

  const { getPreferencesBySlug, updateExploredFeatures } = useWorkspacePreferences();
  const { currentWorkspaceSubscribedPlanDetail: subscriptionDetail } = useWorkspaceSubscription();

  const workspaceSlugStr = workspaceSlug?.toString() ?? "";
  const workspacePreferences = getPreferencesBySlug(workspaceSlugStr);
  const currentSubscription = subscriptionDetail?.product;

  const trySectionItems = useMemo<TTrySectionItem[]>(
    () => [
      {
        title: "Connect to GitHub",
        icon: <GithubIcon className="size-4" />,
        feature: "github_integrated",
        getHref: (slug: string) => `/${slug}/settings/integrations/`,
      },
      {
        title: "Connect to Slack",
        icon: <SlackIcon className="size-4" />,
        feature: "slack_integrated",
        getHref: (slug: string) => `/${slug}/settings/integrations/`,
      },
      {
        title: "Try Plane AI",
        icon: <PiIcon className="size-4" />,
        feature: "ai_chat_tried",
        getHref: (slug: string) => `/${slug}/ai-chat/`,
      },
    ],
    []
  );

  const unexploredItems = useMemo(() => {
    if (!workspacePreferences?.explored_features) return trySectionItems;

    return trySectionItems.filter((item) => !workspacePreferences.explored_features?.[item.feature]);
  }, [workspacePreferences?.explored_features, trySectionItems]);

  const handleTryFeatureClick = useCallback(
    (feature: TExploredFeatures) => {
      if (!workspaceSlugStr) return;
      void updateExploredFeatures(workspaceSlugStr, { [feature]: true });
    },
    [workspaceSlugStr, updateExploredFeatures]
  );

  const toggleOpen = useCallback(() => setIsOpen((prev) => !prev), []);

  // Early returns for when section should not be shown
  if (unexploredItems.length === 0 || currentSubscription === EProductSubscriptionEnum.FREE) {
    return null;
  }

  return (
    <Collapsible render={<div />} className="flex flex-col" defaultOpen>
      <CollapsibleTrigger
        className="group w-full flex items-center gap-2 px-2 py-1.5 rounded-sm text-placeholder hover:bg-layer-transparent-hover"
        onClick={toggleOpen}
      >
        <span className="text-13 font-semibold">Try</span>
        <ChevronRightIcon
          className={cn("flex-shrink-0 size-3.5 transition-transform", {
            "rotate-90": isOpen,
          })}
        />
      </CollapsibleTrigger>
      <Transition
        show={isOpen}
        enter="transition duration-100 ease-out"
        enterFrom="transform scale-95 opacity-0"
        enterTo="transform scale-100 opacity-100"
        leave="transition duration-75 ease-out"
        leaveFrom="transform scale-100 opacity-100"
        leaveTo="transform scale-95 opacity-0"
      >
        <CollapsibleContent className="flex flex-col gap-1">
          {unexploredItems.map((item) => (
            <SidebarNavItem key={item.feature} className="group h-7">
              <Link
                href={item.getHref(workspaceSlugStr)}
                className="flex items-center gap-1.5 text-13 font-medium flex-grow text-tertiary"
                aria-label={item.title}
              >
                {item.icon}
                <span>{item.title}</span>
              </Link>
              <IconButton
                variant="ghost"
                size="sm"
                icon={CloseIcon}
                onClick={() => handleTryFeatureClick(item.feature)}
                className="group-hover:flex hidden"
              />
            </SidebarNavItem>
          ))}
        </CollapsibleContent>
      </Transition>
    </Collapsible>
  );
});
