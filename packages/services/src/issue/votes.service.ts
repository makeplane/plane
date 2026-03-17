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

// plane imports
import { API_BASE_URL } from "@plane/constants";
import type { ActorDetail } from "@plane/types";
// services
import { APIService } from "../api.service";

type TIssueVote = { actor_detail: ActorDetail; vote: 1 | -1 };
export class IssueVotesService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async getVotes(workspaceSlug: string, projectId: string, issueId: string): Promise<TIssueVote[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/work-items/${issueId}/votes/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async removeVote(workspaceSlug: string, projectId: string, issueId: string): Promise<void> {
    return this.delete(`/api/workspaces/${workspaceSlug}/projects/${projectId}/work-items/${issueId}/votes/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async addVote(workspaceSlug: string, projectId: string, issueId: string, voteValue: 1 | -1): Promise<void> {
    return this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/work-items/${issueId}/votes/`, {
      vote: voteValue,
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
