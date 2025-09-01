import type { ICycle } from "./cycle";
import type { IProjectLite } from "./project";

export interface IActiveCycle extends ICycle {
  project_detail: IProjectLite;
}
