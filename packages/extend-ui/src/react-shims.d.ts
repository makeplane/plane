import "react";

declare module "react" {
  interface HTMLAttributes<T> {
    // React 19 attribute used by the vendored components; React 18 renders it fine
    inert?: boolean;
  }
}
