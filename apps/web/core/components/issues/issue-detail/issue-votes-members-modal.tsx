/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { useEffect, useState } from "react";
import { ArrowDown, ArrowUp, X } from "lucide-react";
// plane imports
import { Avatar } from "@plane/propel/avatar";
import { IconButton } from "@plane/propel/icon-button";
import { TabNavigationList, TabNavigationItem } from "@plane/propel/tab-navigation";
import { EModalWidth, EModalPosition, ModalCore } from "@plane/ui";
import { getFileURL } from "@plane/utils";
// hooks
import type { IssueVote } from "@/hooks/use-issue-votes";
// local imports
import type { TVotes } from "./issue-votes";

type TWorkItemVotedMembersModalProps = {
  isOpen: boolean;
  handleClose: () => void;
  upVotes: IssueVote[];
  downVotes: IssueVote[];
  defaultTab?: TVotes;
};

export const WorkItemVotedMembersModal = function WorkItemVotedMembersModal(props: TWorkItemVotedMembersModalProps) {
  const { isOpen, defaultTab = "upVotes", handleClose, upVotes, downVotes } = props;

  const [selectedTab, setSelectedTab] = useState<TVotes>(defaultTab);

  const selectedTabVotes = selectedTab === "upVotes" ? upVotes : downVotes;

  const tabs: { label: string; value: TVotes; icon: React.ReactElement }[] = [
    {
      label: `${upVotes.length} Upvotes`,
      value: "upVotes",
      icon: <ArrowUp className="shrink-0 size-4" />,
    },
    {
      label: `${downVotes.length} Downvotes`,
      value: "downVotes",
      icon: <ArrowDown className="shrink-0 size-4" />,
    },
  ];

  useEffect(() => {
    setSelectedTab(defaultTab);
  }, [defaultTab]);

  return (
    <ModalCore isOpen={isOpen} handleClose={handleClose} position={EModalPosition.TOP} width={EModalWidth.XL}>
      <div className="flex flex-col gap-4 p-4">
        <div className="flex items-center justify-between gap-2">
          <h6 className="text-h5-medium">Votes</h6>

          <IconButton variant="ghost" onClick={handleClose} icon={X} />
        </div>

        <TabNavigationList className="h-10 border-b border-subtle rounded-none">
          {tabs.map((tab) => (
            <div key={tab.value} className="relative h-full flex items-center transition-all duration-300">
              {selectedTab === tab.value && (
                <span className="absolute bottom-0 w-[80%] left-1/2 -translate-x-1/2 h-0.5 bg-(--text-color-icon-primary) rounded-t-md transition-all duration-300" />
              )}
              <TabNavigationItem isActive={selectedTab === tab.value} className="h-6">
                <div
                  className="flex items-center gap-1.5"
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === "Enter" && setSelectedTab(tab.value)}
                  onClick={() => setSelectedTab(tab.value)}
                >
                  {tab.icon}
                  {tab.label}
                </div>
              </TabNavigationItem>
            </div>
          ))}
        </TabNavigationList>

        <div className="flex flex-col gap-5 max-h-72 overflow-y-scroll">
          {selectedTabVotes.map((vote) => (
            <div className="flex items-center gap-2" key={vote.actor_detail?.id}>
              <Avatar name={vote.actor_detail?.display_name} src={getFileURL(vote.actor_detail?.avatar_url ?? "")} />

              <span className="grow truncate text-body-sm-regular">{vote.actor_detail?.display_name}</span>
            </div>
          ))}
          {selectedTabVotes.length === 0 && (
            <span className="text-body-sm-regular text-tertiary">No {selectedTab.toLowerCase()} yet</span>
          )}
        </div>
      </div>
    </ModalCore>
  );
};
