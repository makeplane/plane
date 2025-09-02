"use client";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { SettingsContentWrapper } from "@/components/settings/content-wrapper";
import { useFlag } from "@/plane-web/hooks/store";

const WorkspaceIntegrationsLayout = observer(({ children }: { children: React.ReactNode }) => {
  const { workspaceSlug } = useParams();
  const integrationsEnabled = useFlag(workspaceSlug?.toString(), "SILO_INTEGRATIONS");
  return <SettingsContentWrapper size={integrationsEnabled ? "lg" : "md"}>{children}</SettingsContentWrapper>;
});

export default WorkspaceIntegrationsLayout;
