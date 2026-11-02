/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import Link from "next/link";
import { useParams } from "next/navigation";

// ui
import { useTranslation } from "@plane/i18n";
import { AddWorkItemOutline, SubscribeOutline, UserOutline } from "@makeplane/propel/icons";
import type { IUserProfileData } from "@plane/types";
import { Card } from "@plane/blocks/card";
import { Loader } from "@plane/blocks/skeleton";
// types

type Props = {
  userProfile: IUserProfileData | undefined;
};

export function ProfileStats({ userProfile }: Props) {
  const { workspaceSlug, userId } = useParams();

  const { t } = useTranslation();

  const overviewCards = [
    {
      icon: AddWorkItemOutline,
      route: "created",
      i18n_title: "profile.stats.created",
      value: userProfile?.created_issues ?? "...",
    },
    {
      icon: UserOutline,
      route: "assigned",
      i18n_title: "profile.stats.assigned",
      value: userProfile?.assigned_issues ?? "...",
    },
    {
      icon: SubscribeOutline,
      route: "subscribed",
      i18n_title: "profile.stats.subscribed",
      value: userProfile?.subscribed_issues ?? "...",
    },
  ];

  return (
    <div className="@container space-y-2">
      <h3 className="text-h6-medium">{t("profile.stats.overview")}</h3>
      {userProfile ? (
        <div className="grid grid-cols-1 gap-3 @[40rem]:grid-cols-3">
          {overviewCards.map((card) => (
            <Link
              key={card.route}
              href={`/${workspaceSlug}/profile/${userId}/${card.route}`}
              className="min-w-0 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-accent-strong"
            >
              <Card
                direction="column"
                spacing="sm"
                className="h-full min-w-0 rounded-xl border border-subtle-1 bg-layer-2 p-3"
              >
                <div className="flex min-w-0 flex-col gap-1">
                  <div className="flex min-w-0 items-center gap-1.5">
                    <card.icon className="size-4 shrink-0 text-tertiary" aria-hidden />
                    <p className="truncate text-body-xs-regular text-placeholder" title={t(card.i18n_title)}>
                      {t(card.i18n_title)}
                    </p>
                  </div>
                  <p className="text-h5-semibold">{card.value}</p>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Loader className="grid grid-cols-1 gap-3 @[40rem]:grid-cols-3">
          <Loader.Item height="72px" />
          <Loader.Item height="72px" />
          <Loader.Item height="72px" />
        </Loader>
      )}
    </div>
  );
}
