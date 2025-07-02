import { BasePageHandler } from "@/core/document-types/base-page/handlers";
import { HocusPocusServerContext } from "@/core/types/common";
import { SyncAgentService } from "@/core/services/sync-agent.service";

interface SyncAgentConfig {}

const syncAgentService = new SyncAgentService();

export class SyncAgentHandler extends BasePageHandler<SyncAgentService, SyncAgentConfig> {
  protected documentType = "sync_agent";

  constructor() {
    super(syncAgentService);
  }

  protected getConfig(context: HocusPocusServerContext): SyncAgentConfig {
    return {};
  }
}

export const syncAgentHandler = new SyncAgentHandler();
