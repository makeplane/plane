import { BasePageHandler } from "@/core/document-types/base-page/handlers";
import { ServerAgentService } from "@/core/services/server-agent.service";
import { HocusPocusServerContext } from "@/core/types/common";

type ServerAgentConfig = Record<string, unknown>;

const serverAgentService = new ServerAgentService();

export class ServerAgentHandler extends BasePageHandler<ServerAgentService, ServerAgentConfig> {
  protected documentType = "server_agent";

  constructor() {
    super(serverAgentService);
  }

  protected getConfig(_context: HocusPocusServerContext): ServerAgentConfig {
    return {};
  }
}

export const serverAgentHandler = new ServerAgentHandler();
