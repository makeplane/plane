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

import { set } from "lodash-es";
import { action, observable, makeObservable, runInAction } from "mobx";
import { computedFn } from "mobx-utils";
// plane types
import type { TEditorMentionType } from "@plane/types";
// constants
import { CallbackHandlerStrings } from "@/constants/callback-handler-strings";
// helpers
import { callNative } from "@/helpers";
// types
import type { TMemberResponse, TWorkItemMentionResponse } from "@/types";

type TEntityMentionsInfo = {
  issue_mention: TWorkItemMentionResponse[];
};

export interface IMentionsStore {
  // observable
  members: TMemberResponse[];
  mentions: TEntityMentionsInfo;
  isFetchingMentions: boolean;
  getIsMembersFetched: () => boolean;
  // computed
  getMemberById: (id: string) => TMemberResponse | undefined;
  filterMembersByQuery: (query: string) => TMemberResponse[];
  // action
  fetchMembers: () => Promise<void>;
  setMembers: (members: TMemberResponse[]) => void;
  fetchAllMentions: () => Promise<void>;
  fetchWorkItemMentionById: (entityId: string) => Promise<void>;
  getMentionDetails: (mentionType: TEditorMentionType, entityId: string) => TWorkItemMentionResponse | undefined;
}

export class MentionsStore implements IMentionsStore {
  members: TMemberResponse[] = [];
  mentions: TEntityMentionsInfo = {
    issue_mention: [],
  };
  isFetchingMentions: boolean = false;

  constructor() {
    makeObservable(this, {
      // observable
      members: observable.ref,
      mentions: observable,
      isFetchingMentions: observable,
      // action
      fetchMembers: action,
      setMembers: action,
    });
  }

  /**
   * @description: Checks if members have been fetched
   * @returns {boolean}
   */
  getIsMembersFetched = computedFn(() => this.members.length > 0);

  /**
   * Returns a member by ID
   */
  getMemberById = computedFn((id: string) => this.members.find((member) => member.id === id));

  /**
   * @description: Fetches members from the native side
   */
  fetchMembers = async () => {
    try {
      const membersResponse = await callNative<string>(CallbackHandlerStrings.fetchMembers);
      if (!membersResponse) return;
      const members = JSON.parse(membersResponse) as TMemberResponse[];
      runInAction(() => {
        if (members?.length > 0) {
          this.members = members;
        }
      });
    } catch (error) {
      console.error("Error fetching members", error);
    }
  };

  // specific to page mentions
  fetchAllMentions = async () => {
    try {
      runInAction(() => (this.isFetchingMentions = true));
      const response = await callNative<string>(CallbackHandlerStrings.fetchAllMentions);
      if (!response) return;
      const allMentions = JSON.parse(response) as TEntityMentionsInfo;
      runInAction(() => {
        this.mentions = allMentions;
      });
    } catch (error) {
      console.error("Failed to fetch mentions", error);
    } finally {
      runInAction(() => (this.isFetchingMentions = false));
    }
  };

  fetchWorkItemMentionById = async (entityId: string) => {
    try {
      const response = await callNative<string>(CallbackHandlerStrings.fetchWorkItemMentionById, entityId);
      if (!response) return;
      const workItemMention = JSON.parse(response) as TWorkItemMentionResponse;
      if (!workItemMention) return;

      runInAction(() =>
        set(this.mentions, ["issue_mention"], [...(this.mentions.issue_mention ?? []), workItemMention])
      );
    } catch (error) {
      console.error("Failed to fetch work item mention by id", error);
    }
  };

  getMentionDetails: IMentionsStore["getMentionDetails"] = computedFn((mentionType, entityId) => {
    const existingMention = this.mentions?.[mentionType]?.find((mention) => mention?.id === entityId);
    return existingMention;
  });

  /**
   * @description: Filters members by first name, last name, or display name
   * @param {string} query
   * @returns {TMemberResponse[]}
   */
  filterMembersByQuery = computedFn((query: string) =>
    this.members.filter(
      (member) =>
        member.displayName?.toLowerCase().includes(query.toLowerCase()) ||
        member.firstName?.toLowerCase().includes(query.toLowerCase()) ||
        member.lastName?.toLowerCase().includes(query.toLowerCase())
    )
  );

  /**
   * @description: Sets the members list
   * @param {TMemberResponse[]} members
   */
  setMembers = (members: TMemberResponse[]) => {
    if (!members || members.length === 0) return;
    runInAction(() => (this.members = members));
  };
}
