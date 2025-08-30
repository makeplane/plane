import { CoreProjectViewService } from "./core.service";

export class ExtendedProjectViewService extends CoreProjectViewService {
  constructor(baseUrl: string) {
    super(baseUrl);
  }
}
