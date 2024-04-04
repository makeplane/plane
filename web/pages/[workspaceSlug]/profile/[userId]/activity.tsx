import { ReactElement, useState } from "react";
import { observer } from "mobx-react";
import { useRouter } from "next/router";
// hooks
import { Button } from "@plane/ui";
import { UserProfileHeader } from "@/components/headers";
import { DownloadActivityButton, WorkspaceActivityListPage } from "@/components/profile";
import { EUserWorkspaceRoles } from "@/constants/workspace";
import { useUser } from "@/hooks/store";
// layouts
import { AppLayout } from "@/layouts/app-layout";
import { ProfileAuthWrapper } from "@/layouts/user-profile-layout";
// components
// ui
// types
import { NextPageWithLayout } from "@/lib/types";
// constants

const PER_PAGE = 100;

const ProfileActivityPage: NextPageWithLayout = observer(() => {
  // states
  const [pageCount, setPageCount] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [resultsCount, setResultsCount] = useState(0);
  // router
  const router = useRouter();
  const { userId } = router.query;
  // store hooks
  const { data: currentUser } = useUser();
  const {
    membership: { currentWorkspaceRole },
  } = useUser();

  const updateTotalPages = (count: number) => setTotalPages(count);

  const updateResultsCount = (count: number) => setResultsCount(count);

  const handleLoadMore = () => setPageCount((prev) => prev + 1);

  const activityPages: JSX.Element[] = [];
  for (let i = 0; i < pageCount; i++)
    activityPages.push(
      <WorkspaceActivityListPage
        key={i}
        cursor={`${PER_PAGE}:${i}:0`}
        perPage={PER_PAGE}
        updateResultsCount={updateResultsCount}
        updateTotalPages={updateTotalPages}
      />
    );

  const canDownloadActivity =
    currentUser?.id === userId && !!currentWorkspaceRole && currentWorkspaceRole >= EUserWorkspaceRoles.MEMBER;

  return (
    <div className="flex h-full w-full flex-col overflow-hidden py-5">
      <div className="flex items-center justify-between gap-2 px-5 md:px-9">
        <h3 className="text-lg font-medium">Recent activity</h3>
        {canDownloadActivity && <DownloadActivityButton />}
      </div>
      <div className="vertical-scrollbar scrollbar-md flex h-full flex-col overflow-y-auto px-5 md:px-9">
        {activityPages}
        {pageCount < totalPages && resultsCount !== 0 && (
          <div className="flex w-full items-center justify-center text-xs">
            <Button variant="accent-primary" size="sm" onClick={handleLoadMore}>
              Load more
            </Button>
          </div>
        )}
      </div>
    </div>
  );
});

ProfileActivityPage.getLayout = function getLayout(page: ReactElement) {
  return (
    <AppLayout header={<UserProfileHeader type="Activity" />}>
      <ProfileAuthWrapper>{page}</ProfileAuthWrapper>
    </AppLayout>
  );
};

export default ProfileActivityPage;
