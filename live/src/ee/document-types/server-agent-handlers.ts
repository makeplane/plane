import { BasePageHandler } from "@/core/document-types/base-page/handlers";
import { HocusPocusServerContext } from "@/core/types/common";
import { ServerAgentService } from "@/plane-live/services/server-agent.service";

interface ServerAgentConfig {}

const serverAgentService = new ServerAgentService();

export class ServerAgentHandler extends BasePageHandler<ServerAgentService, ServerAgentConfig> {
  protected documentType = "server_agent";

  constructor() {
    super(serverAgentService);
  }

  protected getConfig(context: HocusPocusServerContext): ServerAgentConfig {
    return {};
  }
}

export const serverAgentHandler = new ServerAgentHandler();
