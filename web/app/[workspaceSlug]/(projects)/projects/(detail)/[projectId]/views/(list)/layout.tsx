"use client";

import { AppHeader } from "@/components/core";
// local components
import { ProjectViewsHeader } from "./header";

export default function ProjectViewsListLayout() {
  return <AppHeader header={<ProjectViewsHeader />} />;
}
