"use client";

import useSWR from "swr";
// layouts
import { PageHead, SidebarHamburgerToggle } from "@/components/core";
import { EmailNotificationForm } from "@/components/profile/notification";
import { EmailSettingsLoader } from "@/components/ui";
// ui
// components
// services
import { UserService } from "@/services/user.service";
// type

// services
const userService = new UserService();

const ProfileNotificationPage = () => {
  // fetching user email notification settings
  const { data, isLoading } = useSWR("CURRENT_USER_EMAIL_NOTIFICATION_SETTINGS", () =>
    userService.currentUserEmailNotificationSettings()
  );

  if (!data || isLoading) {
    return <EmailSettingsLoader />;
  }

  return (
    <>
      <PageHead title="Profile - Email Preference" />
      <div className="mx-auto mt-8 h-full w-full md:px-6 px-4 lg:px-20 pb-8 vertical-scrollbar scrollbar-md">
        <div className="flex gap-4 items-start pt-4 sm:pt-6 mb-2 pb-6 border-b border-custom-border-100">
          <SidebarHamburgerToggle />
          <div className="grow">
            <div className="pb-1 text-xl font-medium text-custom-text-100">Email notifications</div>
            <div className="text-sm font-normal text-custom-text-300">
              Stay in the loop on Issues you are subscribed to. Enable this to get notified.
            </div>
          </div>
        </div>
        <EmailNotificationForm data={data} />
      </div>
    </>
  );
};

export default ProfileNotificationPage;