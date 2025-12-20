// PostHog analytics removed for self-hosted government deployment
import type { ReactNode } from "react";

export interface IPosthogWrapper {
  children: ReactNode;
}

export default function PostHogProvider(props: IPosthogWrapper) {
  return <>{props.children}</>;
}
