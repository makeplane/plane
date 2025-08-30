import { API_BASE_URL } from "@plane/constants";
import { ExtendedProjectViewService } from "./extended.service";

export class ProjectViewService extends ExtendedProjectViewService {
  constructor(baseUrl?: string) {
    super(baseUrl || API_BASE_URL);
  }
}
