import { ExtendedStateService } from "./extended.service";

export class StateService extends ExtendedStateService {
  constructor(baseUrl: string) {
    super(baseUrl);
  }
}
