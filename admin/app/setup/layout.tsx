"use client";

import { ReactNode } from "react";
// layouts
import { DefaultLayout } from "@/layouts/default-layout";
interface SetupLayoutProps {
  children: ReactNode;
  params: any;
}

export default function SetupLayout(props: SetupLayoutProps) {
  const { children } = props;
  return <DefaultLayout>{children}</DefaultLayout>;
}
