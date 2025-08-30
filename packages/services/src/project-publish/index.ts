import { API_BASE_URL } from "@plane/constants";
import { ExtendedProjectPublishService } from "./extended.service";

export class ProjectPublishService extends ExtendedProjectPublishService {
  constructor() {
    super(API_BASE_URL);
  }
}
