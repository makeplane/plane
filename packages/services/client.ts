import { AIService } from "./ai/ai.service";
import { WorkspaceService } from "./workspace/workspace.service";

export class Client {
  ai;
  workspace;

  constructor(BASE_URL: string | undefined) {
    this.user = new UserService(BASE_URL || "");
    this.instance = new InstanceService(BASE_URL || "");

    this.ai = new AIService(BASE_URL || "");
    this.workspace = new WorkspaceService(BASE_URL || "");
  }
}
