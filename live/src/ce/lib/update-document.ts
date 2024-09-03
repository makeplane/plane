type TArgs = {
  params: URLSearchParams;
  pageId: string;
  updatedDescription: Uint8Array;
  cookie: string | undefined;
}

export const updateDocument = (args: TArgs): Promise<void> => {
  const {} = args;
  throw Error("Update failed: Invalid document type provided.");
}