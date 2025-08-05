"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslation } from "@plane/i18n";

// ui
import { UserCircle2 } from "lucide-react";
import { IUserProfileData } from "@plane/types";
import { CreateIcon, LayerStackIcon, Loader, Card, ECardSpacing, ECardDirection } from "@plane/ui";
// types

type Props = {
  userProfile: IUserProfileData | undefined;
};

export const ProfileStats: React.FC<Props> = ({ userProfile }) => {
  const { workspaceSlug, userId } = useParams();
  const { t } = useTranslation();

  const overviewCards = [
    {
      icon: CreateIcon,
      route: "created",
      title: "Issues created",
      value: userProfile?.created_issues ?? "...",
    },
    {
      icon: UserCircle2,
      route: "assigned",
      title: "Issues assigned",
      value: userProfile?.assigned_issues ?? "...",
    },
    {
      icon: LayerStackIcon,
      route: "subscribed",
      title: "Issues subscribed",
      value: userProfile?.subscribed_issues ?? "...",
    },
  ];

  return (
    <div className="space-y-2">
      <h3 className="text-lg font-medium">{t("Overview")}</h3>
      {userProfile ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {overviewCards.map((card) => (
            <Link key={card.route} href={`/${workspaceSlug}/profile/${userId}/${card.route}`}>
              <Card direction={ECardDirection.ROW} spacing={ECardSpacing.SM} className="h-full">
                <div className="grid h-11 w-11 place-items-center rounded bg-custom-background-90">
                  <card.icon className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-custom-text-400">{t(card.title)}</p>
                  <p className="text-xl font-semibold">{card.value}</p>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Loader className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Loader.Item height="80px" />
          <Loader.Item height="80px" />
          <Loader.Item height="80px" />
        </Loader>
      )}
    </div>
  );
};
