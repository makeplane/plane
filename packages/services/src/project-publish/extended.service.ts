import { CoreProjectPublishService } from "./core.service";

export abstract class ExtendedProjectPublishService extends CoreProjectPublishService {
  constructor(baseUrl: string) {
    super(baseUrl);
  }
}
