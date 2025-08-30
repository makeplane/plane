import { API_BASE_URL } from "@plane/constants";
import { ExtendedStateService } from "./extended.service";

export class StateService extends ExtendedStateService {
  constructor() {
    super(API_BASE_URL);
  }
}
