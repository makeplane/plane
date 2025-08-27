import { CoreProjectService } from "./core.service";

export class ExtendedProjectService extends CoreProjectService {
  constructor(BASE_URL: string) {
    super(BASE_URL);
  }
}
