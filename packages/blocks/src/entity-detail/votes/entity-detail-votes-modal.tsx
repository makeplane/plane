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

import { ArrowDown, ArrowUp, X } from "lucide-react";
import { Avatar } from "@plane/propel/avatar";
import { Dialog, EDialogWidth } from "@plane/propel/dialog";
import { IconButton } from "@plane/propel/icon-button";
import { Tabs } from "@plane/propel/tabs";
import type { VoterItem } from "../types";

export type EntityDetailVotesModalProps = {
  isOpen: boolean;
  onClose: () => void;
  upVotes: VoterItem[];
  downVotes: VoterItem[];
  upVotesCount: number;
  downVotesCount: number;
  initialTab?: "upvotes" | "downvotes";
  title?: string;
  upvotesLabel?: string;
  downvotesLabel?: string;
  emptyUpvotesMessage?: string;
  emptyDownvotesMessage?: string;
};

function VoterRow({ voter }: { voter: VoterItem }) {
  return (
    <div className="flex items-center gap-3">
      <Avatar src={voter.avatarUrl} name={voter.displayName} size="base" className="size-6" />
      <span className="text-body-sm-regular text-primary">{voter.displayName}</span>
    </div>
  );
}

function EmptyVotesList({ message }: { message: string }) {
  return <div className="flex items-center justify-center py-6 text-body-xs-regular text-placeholder">{message}</div>;
}

export function EntityDetailVotesModal(props: EntityDetailVotesModalProps) {
  const {
    isOpen,
    onClose,
    upVotes,
    downVotes,
    upVotesCount,
    downVotesCount,
    initialTab = "upvotes",
    title = "Votes",
    upvotesLabel = "Upvotes",
    downvotesLabel = "Downvotes",
    emptyUpvotesMessage = "No upvotes yet",
    emptyDownvotesMessage = "No downvotes yet",
  } = props;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Panel width={EDialogWidth.LG} className="p-0 rounded-xl overflow-clip border-subtle-1 shadow-overlay-200">
        <Tabs defaultValue={initialTab} className="flex flex-col h-full">
          {/* Header + Tabs */}
          <div className="flex flex-col gap-4 p-4">
            <div className="flex items-center gap-2.5">
              <Dialog.Title className="flex-1 text-h5-medium text-primary">{title}</Dialog.Title>
              <IconButton icon={X} onClick={onClose} variant="ghost" size="base" />
            </div>
            <Tabs.List
              background={undefined}
              className="bg-transparent rounded-none border-b border-subtle px-0.5 gap-px justify-start"
            >
              <Tabs.Trigger
                value="upvotes"
                className="group w-auto flex-none flex-col items-center gap-2 rounded-none border-none p-0 shadow-none data-[active]:bg-transparent data-[active]:shadow-none data-[active]:border-none text-tertiary data-[active]:text-primary hover:bg-transparent hover:text-tertiary"
              >
                <div className="flex items-center gap-1.5 rounded-md px-2 py-0.5 h-7 group-data-[active]:bg-layer-transparent-active">
                  <ArrowUp className="size-4" />
                  <span className="text-body-sm-medium whitespace-nowrap">
                    {upVotesCount} {upvotesLabel}
                  </span>
                </div>
                <div className="h-[3px] w-full rounded-full group-data-[active]:bg-primary" />
              </Tabs.Trigger>
              <Tabs.Trigger
                value="downvotes"
                className="group w-auto flex-none flex-col items-center gap-2 rounded-none border-none p-0 shadow-none data-[active]:bg-transparent data-[active]:shadow-none data-[active]:border-none text-tertiary data-[active]:text-primary hover:bg-transparent hover:text-tertiary"
              >
                <div className="flex items-center gap-1.5 rounded-md px-2 py-0.5 h-7 group-data-[active]:bg-layer-transparent-active">
                  <ArrowDown className="size-4" />
                  <span className="text-body-sm-medium whitespace-nowrap">
                    {downVotesCount} {downvotesLabel}
                  </span>
                </div>
                <div className="h-[3px] w-full rounded-full group-data-[active]:bg-primary" />
              </Tabs.Trigger>
            </Tabs.List>
          </div>

          {/* Voter list */}
          <Tabs.Content value="upvotes" className="flex-1 min-h-0 overflow-y-auto p-4">
            {upVotes.length > 0 ? (
              <div className="flex flex-col gap-5">
                {upVotes.map((voter) => (
                  <VoterRow key={voter.id} voter={voter} />
                ))}
              </div>
            ) : (
              <EmptyVotesList message={emptyUpvotesMessage} />
            )}
          </Tabs.Content>

          <Tabs.Content value="downvotes" className="flex-1 min-h-0 overflow-y-auto p-4">
            {downVotes.length > 0 ? (
              <div className="flex flex-col gap-5">
                {downVotes.map((voter) => (
                  <VoterRow key={voter.id} voter={voter} />
                ))}
              </div>
            ) : (
              <EmptyVotesList message={emptyDownvotesMessage} />
            )}
          </Tabs.Content>
        </Tabs>
      </Dialog.Panel>
    </Dialog>
  );
}
