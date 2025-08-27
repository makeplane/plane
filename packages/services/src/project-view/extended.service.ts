import { ProjectViewService } from "./core.service";

export class ExtendedProjectViewService extends ProjectViewService {
  constructor(baseUrl: string) {
    super(baseUrl);
  }
}
