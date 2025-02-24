import { FlatfileService } from "./api.service";

export const createFlatfileClient = (apiKey?: string) => {
  if (!apiKey) {
    throw new Error("Cannot create Flatfile client without an API key. Exiting...");
  }

  return new FlatfileService({ apiKey });
};
