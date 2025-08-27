import { ExtendedProjectViewService } from "./extended.service";

export class ProjectViewService extends ExtendedProjectViewService {
  constructor(baseUrl: string) {
    super(baseUrl);
  }
}
