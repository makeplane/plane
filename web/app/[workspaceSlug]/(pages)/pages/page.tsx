"use client";

import { AppHeader } from "@/components/core";
// components
import { UserGreetingsView } from "@/components/user";
// hooks
import { useUser } from "@/hooks/store";
// plane web components
import { PagesAppDashboardList } from "@/plane-web/components/pages";
import { PagesAppDashboardHeader } from "./header";

export default function WorkspacePagesPage() {
  // store hooks
  const { data: currentUser } = useUser();

  return (
    <>
      <AppHeader header={<PagesAppDashboardHeader />} />
      <div className="space-y-7 md:p-7 p-3 bg-custom-background-90 h-full w-full flex flex-col overflow-y-auto">
        {currentUser && <UserGreetingsView user={currentUser} />}
        <div className="grid sm:grid-cols-2 gap-6">
          <PagesAppDashboardList pageType="public" />
          <PagesAppDashboardList pageType="private" />
          <PagesAppDashboardList pageType="archived" />
        </div>
      </div>
    </>
  );
}
