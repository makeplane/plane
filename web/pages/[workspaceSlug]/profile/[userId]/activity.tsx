import { ReactElement, useState } from "react";
// layouts
import { AppLayout } from "layouts/app-layout";
import { ProfileAuthWrapper } from "layouts/user-profile-layout";
// components
import { UserProfileHeader } from "components/headers";
import { WorkspaceActivityListPage } from "components/profile";
// ui
import { Button } from "@plane/ui";
// types
import { NextPageWithLayout } from "lib/types";

const PER_PAGE = 100;

const ProfileActivityPage: NextPageWithLayout = () => {
  // states
  const [pageCount, setPageCount] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [resultsCount, setResultsCount] = useState(0);

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

  return (
    <div className="h-full w-full overflow-y-auto px-5 py-5 md:px-9 flex flex-col">
      Recent activity
      {activityPages}
      {pageCount < totalPages && resultsCount !== 0 && (
        <div className="flex items-center justify-center text-xs w-full">
          <Button variant="accent-primary" size="sm" onClick={handleLoadMore}>
            Load more
          </Button>
        </div>
      )}
    </div>
  );
};

ProfileActivityPage.getLayout = function getLayout(page: ReactElement) {
  return (
    <AppLayout header={<UserProfileHeader type="Activity" />}>
      <ProfileAuthWrapper>{page}</ProfileAuthWrapper>
    </AppLayout>
  );
};

export default ProfileActivityPage;
