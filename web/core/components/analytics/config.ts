import { mkConfig } from "export-to-csv";

export const csvConfig = (workspaceSlug: string) =>
  mkConfig({
    fieldSeparator: ",",
    filename: `${workspaceSlug}-analytics`,
    decimalSeparator: ".",
    useKeysAsHeaders: true,
  });
