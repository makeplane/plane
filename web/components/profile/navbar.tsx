import React from "react";

import { useRouter } from "next/router";
import Link from "next/link";

// components
import { ProfileIssuesFilter } from "components/profile";
// constants
import { PROFILE_ADMINS_TAB, PROFILE_VIEWER_TAB } from "constants/profile";

type Props = {
  isAuthorized: boolean;
  showProfileIssuesFilter?: boolean;
};

export const ProfileNavbar: React.FC<Props> = (props) => {
  const { isAuthorized, showProfileIssuesFilter } = props;

  const router = useRouter();
  const { workspaceSlug, userId } = router.query;

  const tabsList = isAuthorized ? [...PROFILE_VIEWER_TAB, ...PROFILE_ADMINS_TAB] : PROFILE_VIEWER_TAB;

  return (
    <div className="sticky -top-0.5 z-10 flex items-center justify-between gap-4 border-b border-custom-border-300 bg-custom-background-100 px-4 sm:px-5 md:static">
      <div className="flex items-center overflow-x-scroll">
        {tabsList.map((tab) => (
          <Link key={tab.route} href={`/${workspaceSlug}/profile/${userId}/${tab.route}`}>
            <span
              className={`flex whitespace-nowrap border-b-2 p-4 text-sm font-medium outline-none ${
                router.pathname === tab.selected
                  ? "border-custom-primary-100 text-custom-primary-100"
                  : "border-transparent"
              }`}
            >
              {tab.label}
            </span>
          </Link>
        ))}
      </div>
      {showProfileIssuesFilter && <ProfileIssuesFilter />}
    </div>
  );
};
