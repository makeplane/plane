/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { ArrowDownOutline, CloseOutline, TopArrowOutline } from "@makeplane/propel/icons";
import { Avatar } from "@makeplane/propel/components/avatar";
import {
  Dialog,
  DialogClose,
  DialogCloseGroup,
  DialogContent,
  DialogHeader,
  DialogHeading,
  DialogMain,
  DialogTitle,
} from "@makeplane/propel/components/dialog";
import { Icon } from "@makeplane/propel/components/icon";
import { IconButton } from "@makeplane/propel/components/icon-button";
import { Tab, Tabs, TabsList, TabsPanel } from "@makeplane/propel/components/tabs";
import type { TEntityDetailVoteType } from "./votes";

export type TEntityDetailVoter = {
  id: string;
  displayName: string;
  avatarUrl?: string;
};

export type EntityDetailVotesModalProps = {
  isOpen: boolean;
  onClose: () => void;
  /** The tab shown when the modal opens. */
  initialTab?: TEntityDetailVoteType;
  upVoters: TEntityDetailVoter[];
  downVoters: TEntityDetailVoter[];
  title: string;
  /** Full tab label including the count (e.g. "3 upvotes"), so plurals stay with the caller's locale. */
  upVotesTabLabel: string;
  downVotesTabLabel: string;
  emptyUpVotesMessage: string;
  emptyDownVotesMessage: string;
  closeLabel: string;
};

function VoterList(props: { voters: TEntityDetailVoter[]; emptyMessage: string }) {
  const { voters, emptyMessage } = props;

  if (voters.length === 0)
    return <p className="py-6 text-center text-body-xs-regular text-placeholder">{emptyMessage}</p>;

  return (
    <ul className="flex flex-col gap-5">
      {voters.map((voter) => (
        <li key={voter.id} className="flex min-w-0 items-center gap-3">
          <Avatar
            size="sm"
            src={voter.avatarUrl || undefined}
            alt={voter.displayName}
            fallback={voter.displayName.charAt(0).toUpperCase() || undefined}
          />
          <span className="truncate text-body-sm-regular text-primary">{voter.displayName}</span>
        </li>
      ))}
    </ul>
  );
}

/** Who voted on an entity, split into upvote and downvote tabs. Opened from a vote count. */
export function EntityDetailVotesModal(props: EntityDetailVotesModalProps) {
  const {
    isOpen,
    onClose,
    initialTab = "upvotes",
    upVoters,
    downVoters,
    title,
    upVotesTabLabel,
    downVotesTabLabel,
    emptyUpVotesMessage,
    emptyDownVotesMessage,
    closeLabel,
  } = props;

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent size="md">
        <DialogCloseGroup>
          <IconButton
            variant="ghost"
            size="xs"
            aria-label={closeLabel}
            icon={<Icon icon={CloseOutline} />}
            render={<DialogClose />}
          />
        </DialogCloseGroup>
        <DialogMain>
          <DialogHeader>
            <DialogHeading>
              <DialogTitle>{title}</DialogTitle>
            </DialogHeading>
          </DialogHeader>
          <Tabs variant="underline" defaultValue={initialTab}>
            <div className="border-b border-subtle">
              <TabsList>
                <Tab value="upvotes" icon={<Icon icon={TopArrowOutline} />} label={upVotesTabLabel} />
                <Tab value="downvotes" icon={<Icon icon={ArrowDownOutline} />} label={downVotesTabLabel} />
              </TabsList>
            </div>
            <TabsPanel value="upvotes">
              <div
                tabIndex={0}
                className="vertical-scrollbar scrollbar-sm max-h-[60vh] overflow-y-auto py-4 outline-none"
              >
                <VoterList voters={upVoters} emptyMessage={emptyUpVotesMessage} />
              </div>
            </TabsPanel>
            <TabsPanel value="downvotes">
              <div
                tabIndex={0}
                className="vertical-scrollbar scrollbar-sm max-h-[60vh] overflow-y-auto py-4 outline-none"
              >
                <VoterList voters={downVoters} emptyMessage={emptyDownVotesMessage} />
              </div>
            </TabsPanel>
          </Tabs>
        </DialogMain>
      </DialogContent>
    </Dialog>
  );
}
