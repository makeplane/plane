import { ReactElement, useState } from "react";
import { observer } from "mobx-react";
//hooks
import { useApplication } from "hooks/store";
// layouts
import { ProfileSettingsLayout } from "layouts/settings-layout";
// components
import { SidebarHamburgerToggle } from "components/core/sidebar/sidebar-menu-hamburger-toggle";
import { ProfileActivityListPage } from "components/profile";
import { PageHead } from "components/core";
// ui
import { Button } from "@plane/ui";
// type
import { NextPageWithLayout } from "lib/types";

const PER_PAGE = 100;

const ProfileActivityPage: NextPageWithLayout = observer(() => {
  // states
  const [pageCount, setPageCount] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [resultsCount, setResultsCount] = useState(0);
  // store hooks
  const { theme: themeStore } = useApplication();

  const updateTotalPages = (count: number) => setTotalPages(count);

  const updateResultsCount = (count: number) => setResultsCount(count);

  const handleLoadMore = () => setPageCount((prev) => prev + 1);

  const activityPages: JSX.Element[] = [];
  for (let i = 0; i < pageCount; i++)
    activityPages.push(
      <ProfileActivityListPage
        key={i}
        cursor={`${PER_PAGE}:${i}:0`}
        perPage={PER_PAGE}
        updateResultsCount={updateResultsCount}
        updateTotalPages={updateTotalPages}
      />
    );

  return (
    <>
      <PageHead title="Profile - Activity" />
      <section className="mx-auto mt-5 md:mt-16 h-full w-full flex flex-col overflow-hidden px-8 pb-8 lg:w-3/5">
        <div className="flex items-center border-b border-custom-border-100 gap-4 pb-3.5">
          <SidebarHamburgerToggle onClick={() => themeStore.toggleSidebar()} />
          <h3 className="text-xl font-medium">Activity</h3>
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
      </section>
    </>
  );
});

ProfileActivityPage.getLayout = function getLayout(page: ReactElement) {
  return <ProfileSettingsLayout>{page}</ProfileSettingsLayout>;
};

export default ProfileActivityPage;
