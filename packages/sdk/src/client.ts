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

import { CycleService } from "@/services/cycle.service";
import { EpicService } from "@/services/epic.service";
import { IssueCommentService } from "@/services/issue-comment.service";
import {
  IssueTypeService,
  IssuePropertyService,
  IssuePropertyOptionService,
  IssuePropertyValueService,
} from "@/services/issue-types";
import { IssueService } from "@/services/issue.service";
import { LabelService } from "@/services/label.service";
import { ModuleService } from "@/services/module.service";
import { PageService } from "@/services/page.service";
import { ProjectService } from "@/services/project.service";
import { StateService } from "@/services/state.service";
import { UserService } from "@/services/user.service";

// types
import type { ClientOptions } from "@/types/types";
import { AssetService, IntakeService } from "./services";
import { WorkspaceService } from "./services/workspace.service";

export class Client {
  options: ClientOptions;
  workspace: WorkspaceService;
  users: UserService;
  label: LabelService;
  state: StateService;
  issue: IssueService;
  intake: IntakeService;
  assets: AssetService;
  cycles: CycleService;
  modules: ModuleService;
  project: ProjectService;
  issueComment: IssueCommentService;
  // issue types
  issueType: IssueTypeService;
  issueProperty: IssuePropertyService;
  issuePropertyOption: IssuePropertyOptionService;
  issuePropertyValue: IssuePropertyValueService;
  epic: EpicService;
  page: PageService;

  constructor(options: ClientOptions) {
    this.options = options;
    this.workspace = new WorkspaceService(options);
    this.label = new LabelService(options);
    this.state = new StateService(options);
    this.issue = new IssueService(options);
    this.intake = new IntakeService(options);
    this.users = new UserService(options);
    this.project = new ProjectService(options);
    this.issueComment = new IssueCommentService(options);
    this.cycles = new CycleService(options);
    this.modules = new ModuleService(options);
    this.assets = new AssetService(options);
    // issue types
    this.issueType = new IssueTypeService(options);
    this.issueProperty = new IssuePropertyService(options);
    this.issuePropertyOption = new IssuePropertyOptionService(options);
    this.issuePropertyValue = new IssuePropertyValueService(options);
    this.epic = new EpicService(options);
    this.page = new PageService(options);
  }
}
