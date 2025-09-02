"use client";

import { useParams } from "next/navigation";
import { ContentWrapper } from "@plane/ui";
import { cn } from "@plane/utils";
// components
import { AppHeader } from "@/components/core/app-header";
import { RecentActivityWidget } from "@/components/home/widgets/recents/index";
import { StickiesWidget } from "@/components/stickies/widget";
import { UserGreetingsView } from "@/components/user";
// hooks
import { useUser } from "@/hooks/store/user/user-user";
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
      <ContentWrapper
        className={cn("gap-6 bg-custom-background-100 max-w-[800px] mx-auto scrollbar-hide px-page-x lg:px-0")}
      >
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
      </ContentWrapper>
    </>
  );
}
