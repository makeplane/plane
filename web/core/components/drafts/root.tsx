"use client";

import React, { useCallback, useEffect, useRef } from 'react'
import { observer } from 'mobx-react';
import { useParams } from 'next/navigation';
import { EIssuesStoreType } from '@/constants/issue';
import { useIssues } from '@/hooks/store';
import { useIssueStoreType } from '@/hooks/use-issue-layout-store';
import { useIssuesActions } from '@/hooks/use-issues-actions';
import useLocalStorage from '@/hooks/use-local-storage';
import { IssueBlockRoot } from '../issues';
import { TRenderQuickActions } from '../issues/issue-layouts/list/list-view-types';
import Banner from './Banner'


const Root = observer(() => {

  const {
    issues: { fetchIssues},
    issueMap
  } = useIssues(EIssuesStoreType.WORKSPACE_DRAFT);

  const { workspaceSlug } = useParams();

  useEffect(() => {
    fetchIssues(workspaceSlug.toString(),"init-loader", {
      canGroup: false,
      perPageCount: 25
    });
  }, [fetchIssues, workspaceSlug])

    const containerRef = useRef<HTMLDivElement | null>(null);

    const renderQuickActions: TRenderQuickActions = useCallback(
    ({ issue, parentRef }) => (
      <></>
    ),
    []
  );


  const storeType = useIssueStoreType() as EIssuesStoreType.WORKSPACE_DRAFT;
  const { issuesFilter } = useIssues(storeType);

  // let displayProperties = issuesFilter?.issueFilters?.displayProperties;

  const displayProperties = {
  "assignee": true,
  "start_date": true,
  "due_date": true,
  "labels": true,
  "priority": true,
  "state": true,
  "sub_issue_count": true,
  "attachment_count": true,
  "link": true,
  "estimate": true,
  "key": true,
  "created_on": true,
  "updated_on": true,
  "modules": true,
  "cycle": true,
  "issue_type": true
}

  const {
    updateIssue,
  } = useIssuesActions(storeType);

  const canEditProperties = (projectId: string | undefined) => true


  const { storedValue: isBannerHidden, setValue: hideBanner } = useLocalStorage<boolean>(
    "isBannerHidden",
    false
  );

  useEffect(() => {
    if (!isBannerHidden) {
      hideBanner(true);
    }
  }, [isBannerHidden, hideBanner]);
  return (
    <>

  {!isBannerHidden && <Banner />}
    <div className="relative h-full w-full">
        {issueMap &&
          Object.keys(issueMap).map((issueId: string, index: number) => (
          <IssueBlockRoot
            key={issueId}
            issueId={issueId}
            issuesMap={issueMap}
            updateIssue={updateIssue}
            quickActions={renderQuickActions}
            canEditProperties={canEditProperties}
            displayProperties={displayProperties}
            nestingLevel={0}
            spacingLeft={0}
            containerRef={containerRef}
            selectionHelpers={{
              handleClearSelection: () => {},
              handleEntityClick: (event: React.MouseEvent, entityID: string, groupId: string) => {},
              getIsEntitySelected: (entityID: string) => false,
              getIsEntityActive: (entityID: string) => false,
              handleGroupClick: (groupID: string) => {},
              isGroupSelected: (groupID: string) => "empty",
              isSelectionDisabled: true,
            }}
            groupId={"1"}
            isLastChild={index === Object.keys(issueMap).length - 1}
            isDragAllowed={false}
            canDropOverIssue={false}
          />
        ))}
    </div>
    </>
  )
})

export default Root;