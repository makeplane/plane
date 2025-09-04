import { BasePageHandler } from "@/core/document-types/base-page/handlers";
import { SyncAgentService } from "@/core/services/sync-agent.service";
import { HocusPocusServerContext } from "@/core/types/common";

type SyncAgentConfig = Record<string, unknown>;

const syncAgentService = new SyncAgentService();

export class SyncAgentHandler extends BasePageHandler<SyncAgentService, SyncAgentConfig> {
  protected documentType = "sync_agent";

  constructor() {
    super(syncAgentService);
  }

  protected getConfig(_context: HocusPocusServerContext): SyncAgentConfig {
    return {};
  }
}

export const syncAgentHandler = new SyncAgentHandler();
