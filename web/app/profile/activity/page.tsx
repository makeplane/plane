"use client";

import { useState } from "react";
import { observer } from "mobx-react";
// ui
import { Button } from "@plane/ui";
// components
import { PageHead } from "@/components/core";
import { EmptyState } from "@/components/empty-state";
import {
  ProfileActivityListPage,
  ProfileSettingContentHeader,
  ProfileSettingContentWrapper,
} from "@/components/profile";
// constants
import { EmptyStateType } from "@/constants/empty-state";

const PER_PAGE = 100;

const ProfileActivityPage = observer(() => {
  // states
  const [pageCount, setPageCount] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [resultsCount, setResultsCount] = useState(0);
  const [isEmpty, setIsEmpty] = useState(false);

  const updateTotalPages = (count: number) => setTotalPages(count);

  const updateResultsCount = (count: number) => setResultsCount(count);

  const updateEmptyState = (isEmpty: boolean) => setIsEmpty(isEmpty);

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
        updateEmptyState={updateEmptyState}
      />
    );

  const isLoadMoreVisible = pageCount < totalPages && resultsCount !== 0;

  if (isEmpty) {
    return <EmptyState type={EmptyStateType.PROFILE_ACTIVITY} layout="screen-detailed" />;
  }

  return (
    <>
      <PageHead title="Profile - Activity" />
      <ProfileSettingContentWrapper>
        <ProfileSettingContentHeader title="Activity" />
        {activityPages}
        {isLoadMoreVisible && (
          <div className="flex w-full items-center justify-center text-xs">
            <Button variant="accent-primary" size="sm" onClick={handleLoadMore}>
              Load more
            </Button>
          </div>
        )}
      </ProfileSettingContentWrapper>
    </>
  );
});

export default ProfileActivityPage;
