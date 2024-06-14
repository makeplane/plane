// types
import { TPage } from "@plane/types";

export type TWorkspacePage = Omit<TPage, "project"> & {
  projects: string[] | undefined;
};
