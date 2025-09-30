import { PageCoreService } from "./core.service";

/**
 * This is the extended service for the page service.
 * It extends the core service and adds additional functionality.
 * Implementation for this is found in the enterprise repository.
 */
export abstract class PageService extends PageCoreService {
  constructor() {
    super();
  }
}
