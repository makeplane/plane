import { CoreStateService } from "./core.service";

export class ExtendedStateService extends CoreStateService {
  constructor(baseUrl: string) {
    super(baseUrl);
  }
}
