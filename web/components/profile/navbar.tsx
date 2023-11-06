import React from "react";

import { useRouter } from "next/router";
import Link from "next/link";

// components
import { ProfileIssuesFilter } from "components/profile";

type Props = {
  isAuthorized: boolean;
  showProfileIssuesFilter?: boolean;
};

const viewerTabs = [
  {
    route: "",
    label: "Overview",
    selected: "/[workspaceSlug]/profile/[userId]",
  },
];

const adminTabs = [
  {
    route: "assigned",
    label: "Assigned",
    selected: "/[workspaceSlug]/profile/[userId]/assigned",
  },
  {
    route: "created",
    label: "Created",
    selected: "/[workspaceSlug]/profile/[userId]/created",
  },
  {
    route: "subscribed",
    label: "Subscribed",
    selected: "/[workspaceSlug]/profile/[userId]/subscribed",
  },
];

export const ProfileNavbar: React.FC<Props> = (props) => {
  const { isAuthorized, showProfileIssuesFilter } = props;

  const router = useRouter();
  const { workspaceSlug, userId } = router.query;

  const tabsList = isAuthorized ? [...viewerTabs, ...adminTabs] : viewerTabs;

  return (
    <div className="sticky -top-0.5 z-[1] md:static px-4 sm:px-5 flex items-center justify-between gap-4 bg-custom-background-100 border-b border-custom-border-300">
      <div className="flex items-center overflow-x-scroll">
        {tabsList.map((tab) => (
          <Link key={tab.route} href={`/${workspaceSlug}/profile/${userId}/${tab.route}`}>
            <a
              className={`border-b-2 p-4 text-sm font-medium outline-none whitespace-nowrap ${
                router.pathname === tab.selected
                  ? "border-custom-primary-100 text-custom-primary-100"
                  : "border-transparent"
              }`}
            >
              {tab.label}
            </a>
          </Link>
        ))}
      </div>
      {showProfileIssuesFilter && <ProfileIssuesFilter />}
    </div>
  );
};
