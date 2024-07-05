import React, { ComponentType, Suspense } from "react";

export default function withSuspense<P extends object>(Component: ComponentType<P>) {
  return function WithSuspenseComponent(props: P) {
    return (
      <Suspense>
        <Component {...props} />
      </Suspense>
    );
  };
}
