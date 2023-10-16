import { useRouter } from "next/router";
import Link from "next/link";

// ui
import { Icon } from "components/ui";
import { Loader } from "@plane/ui";
// types
import { IUserProfileData } from "types";

type Props = {
  userProfile: IUserProfileData | undefined;
};

export const ProfileStats: React.FC<Props> = ({ userProfile }) => {
  const router = useRouter();
  const { workspaceSlug, userId } = router.query;

  const overviewCards = [
    {
      icon: "new_window",
      route: "created",
      title: "Issues created",
      value: userProfile?.created_issues ?? "...",
    },
    {
      icon: "account_circle",
      route: "assigned",
      title: "Issues assigned",
      value: userProfile?.assigned_issues ?? "...",
    },
    {
      icon: "subscriptions",
      route: "subscribed",
      title: "Issues subscribed",
      value: userProfile?.subscribed_issues ?? "...",
    },
  ];

  return (
    <div className="space-y-2">
      <h3 className="text-lg font-medium">Overview</h3>
      {userProfile ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {overviewCards.map((card) => (
            <Link key={card.route} href={`/${workspaceSlug}/profile/${userId}/${card.route}`}>
              <a className="flex items-center gap-3 p-4 rounded border border-custom-border-100 whitespace-nowrap">
                <div className="h-11 w-11 bg-custom-background-90 rounded grid place-items-center">
                  <Icon iconName={card.icon} className="!text-xl" />
                </div>
                <div className="space-y-1">
                  <p className="text-custom-text-400 text-sm">{card.title}</p>
                  <p className="text-xl font-semibold">{card.value}</p>
                </div>
              </a>
            </Link>
          ))}
        </div>
      ) : (
        <Loader className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Loader.Item height="80px" />
          <Loader.Item height="80px" />
          <Loader.Item height="80px" />
        </Loader>
      )}
    </div>
  );
};
