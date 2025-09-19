"use client";
// components
import { SettingsContentWrapper } from "@/components/settings/content-wrapper";

const IntegrationsLayout = ({ children }: { children: React.ReactNode }) => (
  <SettingsContentWrapper size="md">{children}</SettingsContentWrapper>
);

export default IntegrationsLayout;
