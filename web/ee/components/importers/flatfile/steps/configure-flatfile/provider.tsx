"use client";

import { FlatfileProvider } from "@flatfile/react";

const FlatfileClientProvider: typeof FlatfileProvider = (props) => (
  <FlatfileProvider {...props}>{props.children}</FlatfileProvider>
);

export default FlatfileClientProvider;
