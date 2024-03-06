import { ReactElement, useState } from "react";
import { useRouter } from "next/router";
import { observer } from "mobx-react";
// hooks
import { useUser } from "hooks/store";
// layouts
import { AppLayout } from "layouts/app-layout";
import { ProfileAuthWrapper } from "layouts/user-profile-layout";
// components
import { UserProfileHeader } from "components/headers";
import { DownloadActivityButton, WorkspaceActivityListPage } from "components/profile";
// ui
import { Button } from "@plane/ui";
// types
import { NextPageWithLayout } from "lib/types";
// constants
import { EUserWorkspaceRoles } from "constants/workspace";

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
  const {
    currentUser,
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
    <div className="h-full w-full px-5 py-5 md:px-9 flex flex-col overflow-hidden">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-lg font-medium">Recent activity</h3>
        {canDownloadActivity && <DownloadActivityButton />}
      </div>
      <div className="h-full flex flex-col overflow-y-auto">
        {activityPages}
        {pageCount < totalPages && resultsCount !== 0 && (
          <div className="flex items-center justify-center text-xs w-full">
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
