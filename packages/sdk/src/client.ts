import { CycleService } from "@/services/cycle.service";
import { IssueCommentService } from "@/services/issue-comment.service";
import { IssueService } from "@/services/issue.service";
import { LabelService } from "@/services/label.service";
import { ModuleService } from "@/services/module.service";
import { ProjectService } from "@/services/project.service";
import { StateService } from "@/services/state.service";
import { UserService } from "@/services/user.service";
import {
  IssueTypeService,
  IssuePropertyService,
  IssuePropertyOptionService,
  IssuePropertyValueService,
} from "@/services/issue-types";

// types
import { ClientOptions } from "@/types/types";
import { AssetService } from "./services";

export class Client {
  options: ClientOptions;
  users: UserService;
  label: LabelService;
  state: StateService;
  issue: IssueService;
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

  constructor(options: ClientOptions) {
    this.options = options;
    this.label = new LabelService(options);
    this.state = new StateService(options);
    this.issue = new IssueService(options);
    this.users = new UserService(options);
    this.project = new ProjectService(options);
    this.issueComment = new IssueCommentService(options);
    this.assets = new AssetService(options);
    this.cycles = new CycleService(options);
    this.modules = new ModuleService(options);
    this.assets = new AssetService(options);
    // issue types
    this.issueType = new IssueTypeService(options);
    this.issueProperty = new IssuePropertyService(options);
    this.issuePropertyOption = new IssuePropertyOptionService(options);
    this.issuePropertyValue = new IssuePropertyValueService(options);
  }
}
