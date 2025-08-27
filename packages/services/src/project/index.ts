import { API_BASE_URL } from "@plane/constants";
import { ExtendedProjectService } from "./extended.service";

export class ProjectService extends ExtendedProjectService {
  constructor() {
    super(API_BASE_URL || "");
  }
}
