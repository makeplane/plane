import { ConnectionConfiguration } from "@hocuspocus/server";

type TArgs = {
  connection: ConnectionConfiguration
  cookie: string | undefined;
  params: URLSearchParams;
}

export const authenticateUser = (args: TArgs): Promise<void> => {
  const {} = args;
  throw Error("Authentication failed: Invalid document type provided.");
}