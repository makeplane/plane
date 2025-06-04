import type { IProjectLite, ICycle } from "@plane/types";

export interface IActiveCycle extends ICycle {
  project_detail: IProjectLite;
}
