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
import { cn } from "@plane/utils";
import { ContentWrapper } from "@plane/ui";

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
