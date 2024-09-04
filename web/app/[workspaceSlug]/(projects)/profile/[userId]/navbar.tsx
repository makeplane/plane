import React from "react";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";

// components
// constants
import { Header, EHeaderVariant } from "@plane/ui";
import { PROFILE_ADMINS_TAB, PROFILE_VIEWER_TAB } from "@/constants/profile";

type Props = {
  isAuthorized: boolean;
};

export const ProfileNavbar: React.FC<Props> = (props) => {
  const { isAuthorized } = props;

  const { workspaceSlug, userId } = useParams();
  const pathname = usePathname();

  const tabsList = isAuthorized ? [...PROFILE_VIEWER_TAB, ...PROFILE_ADMINS_TAB] : PROFILE_VIEWER_TAB;

  return (
    <Header variant={EHeaderVariant.SECONDARY} showOnMobile={false}>
      <div className="flex items-center overflow-x-scroll">
        {tabsList.map((tab) => (
          <Link key={tab.route} href={`/${workspaceSlug}/profile/${userId}/${tab.route}`}>
            <span
              className={`flex whitespace-nowrap border-b-2 p-4 text-sm font-medium outline-none ${
                pathname === `/${workspaceSlug}/profile/${userId}${tab.selected}`
                  ? "border-custom-primary-100 text-custom-primary-100"
                  : "border-transparent"
              }`}
            >
              {tab.label}
            </span>
          </Link>
        ))}
      </div>
    </Header>
  );
};
