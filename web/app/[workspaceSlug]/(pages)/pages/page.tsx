"use client";

import { useParams } from "next/navigation";
// components
import { AppHeader } from "@/components/core";
import { RecentActivityWidget } from "@/components/home";
import { StickiesWidget } from "@/components/stickies";
import { UserGreetingsView } from "@/components/user";
// hooks
import { useUser } from "@/hooks/store";
// plane web components
import { PagesAppDashboardHeader } from "./header";

export default function WorkspacePagesPage() {
  // navigation
  const { workspaceSlug } = useParams();
  // store hooks
  const { data: currentUser } = useUser();

  return (
    <>
      <AppHeader header={<PagesAppDashboardHeader />} />
      <div className="space-y-7 md:p-7 p-3 bg-custom-background-90/20 size-full flex flex-col overflow-y-auto">
        {currentUser && <UserGreetingsView user={currentUser} />}
        {workspaceSlug && (
          <div className="size-full divide-y-[1px] divide-custom-border-100">
            <div className="py-4">
              <RecentActivityWidget
                workspaceSlug={workspaceSlug.toString()}
                presetFilter="workspace_page"
                showFilterSelect={false}
              />
            </div>
            <div className="py-4">
              <StickiesWidget />
            </div>
          </div>
        )}
      </div>
    </>
  );
}
