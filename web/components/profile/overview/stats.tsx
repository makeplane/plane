import { useRouter } from "next/router";
import Link from "next/link";

// ui
import { CreateIcon, LayerStackIcon, Loader } from "@plane/ui";
import { UserCircle2 } from "lucide-react";
// types
import { IUserProfileData } from "@plane/types";

type Props = {
  userProfile: IUserProfileData | undefined;
};

export const ProfileStats: React.FC<Props> = ({ userProfile }) => {
  const router = useRouter();
  const { workspaceSlug, userId } = router.query;

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
      <h3 className="text-lg font-medium">Overview</h3>
      {userProfile ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {overviewCards.map((card) => (
            <Link key={card.route} href={`/${workspaceSlug}/profile/${userId}/${card.route}`}>
              <span className="flex items-center gap-3 whitespace-nowrap rounded border border-custom-border-100 p-4">
                <div className="grid h-11 w-11 place-items-center rounded bg-custom-background-90">
                  <card.icon className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-custom-text-400">{card.title}</p>
                  <p className="text-xl font-semibold">{card.value}</p>
                </div>
              </span>
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
