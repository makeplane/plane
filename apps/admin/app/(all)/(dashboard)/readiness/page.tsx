/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { AlertCircle, CheckCircle2, CircleOff, Info, MinusCircle } from "lucide-react";
import { Badge } from "@plane/propel/badge";
import type { IInstanceCapabilities, TCapabilityAvailableState, TCapabilityEnabledState } from "@plane/types";
import { Loader } from "@plane/ui";
// components
import { PageWrapper } from "@/components/common/page-wrapper";
// hooks
import { useInstance } from "@/hooks/store";
// types
import type { Route } from "./+types/page";

type TReadinessVariant = "success" | "warning" | "neutral" | "danger";

type TReadinessStatus = {
  label: string;
  variant: TReadinessVariant;
  description: string;
};

type TCapabilityItem = {
  name: string;
  status: TReadinessStatus;
  guidance: string;
};

type TCapabilitySection = {
  title: string;
  description: string;
  items: TCapabilityItem[];
};

function readinessStatus(
  capability: Pick<TCapabilityEnabledState, "available" | "enabled" | "configured" | "ready">
): TReadinessStatus {
  if (!capability.available) return unavailableStatus;
  if (capability.ready) return readyStatus;
  if (!capability.enabled) return disabledStatus;
  if (!capability.configured) return notConfiguredStatus;
  return configuredStatus;
}

function availabilityStatus(capability: TCapabilityAvailableState): TReadinessStatus {
  return capability.available ? availableStatus : unavailableStatus;
}

function statusIcon(variant: TReadinessVariant) {
  const icons = {
    success: <CheckCircle2 aria-hidden="true" />,
    warning: <AlertCircle aria-hidden="true" />,
    neutral: <MinusCircle aria-hidden="true" />,
    danger: <CircleOff aria-hidden="true" />,
  };
  return icons[variant];
}

function capabilitySections(capabilities: IInstanceCapabilities): TCapabilitySection[] {
  const oauthProviders = capabilities.oauth.providers;
  const projectFeatures = capabilities.project_features;

  return [
    {
      title: "Communication",
      description: "Email delivery for invitations, password resets, magic links, and notifications.",
      items: [
        {
          name: "SMTP / email",
          status: readinessStatus(capabilities.smtp),
          guidance: capabilities.smtp.ready
            ? "Email delivery is configured enough for Plane to attempt SMTP delivery. Use the existing Email settings page for changes and manual test email actions."
            : "Required keys: ENABLE_SMTP, EMAIL_HOST, EMAIL_PORT, EMAIL_FROM. Configure them through Email settings or deployment configuration. Credentials such as EMAIL_HOST_PASSWORD are never shown here.",
        },
      ],
    },
    {
      title: "Storage",
      description: "Object storage backing attachments, exports, and uploaded assets.",
      items: [
        {
          name: "Object storage",
          status: capabilities.object_storage.ready ? readyStatus : notConfiguredStatus,
          guidance: capabilities.object_storage.ready
            ? "The S3-compatible storage settings required by the application are present. This is configuration readiness, not a live bucket health check."
            : "Required keys: AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_S3_BUCKET_NAME. Configure S3-compatible or MinIO settings in the deployment environment. Credentials are not displayed here.",
        },
      ],
    },
    {
      title: "Authentication",
      description:
        "Optional OAuth providers. Password and magic-link behavior remains controlled by existing authentication settings.",
      items: [
        oauthItem("Google OAuth", oauthProviders.google),
        oauthItem("GitHub OAuth", oauthProviders.github),
        oauthItem("GitLab OAuth", oauthProviders.gitlab),
        oauthItem("Gitea OAuth", oauthProviders.gitea),
      ],
    },
    {
      title: "AI",
      description: "AI assistant readiness based on configured LLM provider credentials and model settings.",
      items: [
        {
          name: "AI assistant",
          status: readinessStatus(capabilities.ai),
          guidance: capabilities.ai.ready
            ? "AI configuration is present. Existing workspace/project permissions still decide who may use AI actions."
            : "Required keys: LLM_PROVIDER, LLM_MODEL, LLM_API_KEY. The provider must be openai, anthropic, or gemini, and the model must be one already supported by that provider. This page does not call the LLM or reveal API keys.",
        },
      ],
    },
    {
      title: "Instance services",
      description: "Instance-level services that are optional or deployment-dependent.",
      items: [
        {
          name: "Telemetry",
          status: capabilities.telemetry.enabled ? enabledStatus : disabledStatus,
          guidance: capabilities.telemetry.enabled
            ? "Telemetry is enabled for this instance. It is optional and not required for core project management."
            : "Telemetry is disabled. Core project management continues to work without outbound telemetry.",
        },
        {
          name: "Public projects / Space",
          status: availabilityStatus(capabilities.public_projects),
          guidance:
            "The instance includes public project publishing support through Space. Whether a project is public is controlled by each project's publishing state.",
        },
      ],
    },
    {
      title: "Supported project capabilities",
      description:
        "Availability here means the instance supports the implementation. Individual project settings control whether each capability is enabled for a project.",
      items: [
        projectFeatureItem("Cycles", projectFeatures.cycles),
        projectFeatureItem("Modules", projectFeatures.modules),
        projectFeatureItem("Views", projectFeatures.views),
        projectFeatureItem("Pages", projectFeatures.pages),
        projectFeatureItem("Intake", projectFeatures.intake),
      ],
    },
  ];
}

function oauthItem(name: string, capability: TCapabilityEnabledState): TCapabilityItem {
  return {
    name,
    status: readinessStatus(capability),
    guidance: capability.ready
      ? "Provider configuration is present. OAuth sign-in still follows the existing authentication flow and provider callback configuration."
      : "Required keys: client ID, client secret, the provider enabled flag, and GITLAB_HOST or GITEA_HOST for those providers. Configure them through Authentication settings. Client secrets are never shown here.",
  };
}

function projectFeatureItem(name: string, capability: TCapabilityAvailableState): TCapabilityItem {
  return {
    name,
    status: availabilityStatus(capability),
    guidance: "This is implementation support only. Per-project feature settings remain authoritative.",
  };
}

function CapabilitySection(props: { section: TCapabilitySection }) {
  const { section } = props;
  const sectionId = `readiness-${section.title.toLowerCase().replaceAll(" ", "-")}`;

  return (
    <section className="space-y-3 rounded-lg border border-subtle bg-surface-1 p-4" aria-labelledby={sectionId}>
      <div>
        <h2 id={sectionId} className="text-16 font-medium text-primary">
          {section.title}
        </h2>
        <p className="mt-1 text-13 leading-5 text-tertiary">{section.description}</p>
      </div>
      <div className="divide-y divide-subtle rounded-md border border-subtle bg-layer-1">
        {section.items.map((capabilityItem) => (
          <CapabilityRow key={capabilityItem.name} item={capabilityItem} />
        ))}
      </div>
    </section>
  );
}

function CapabilityRow(props: { item: TCapabilityItem }) {
  const { item } = props;

  return (
    <div className="grid grid-cols-1 gap-3 p-4 md:grid-cols-[minmax(180px,240px)_auto] md:items-start">
      <div className="flex items-center gap-3">
        <Badge variant={item.status.variant} prependIcon={statusIcon(item.status.variant)}>
          {item.status.label}
        </Badge>
        <span className="text-13 font-medium text-primary">{item.name}</span>
      </div>
      <div className="space-y-1 text-13 leading-5 text-secondary">
        <p>{item.status.description}</p>
        <p className="text-tertiary">{item.guidance}</p>
      </div>
    </div>
  );
}

function ReadinessLoader() {
  return (
    <Loader className="space-y-4">
      <Loader.Item height="120px" width="100%" />
      <Loader.Item height="180px" width="100%" />
      <Loader.Item height="140px" width="100%" />
    </Loader>
  );
}

const readyStatus: TReadinessStatus = {
  label: "Ready",
  variant: "success",
  description: "Available, enabled, and configured for the instance to attempt normal operation.",
};

const configuredStatus: TReadinessStatus = {
  label: "Configured",
  variant: "success",
  description: "Required configuration is present.",
};

const enabledStatus: TReadinessStatus = {
  label: "Enabled",
  variant: "success",
  description: "Enabled for this instance.",
};

const availableStatus: TReadinessStatus = {
  label: "Available",
  variant: "success",
  description: "Implementation support is present in this instance.",
};

const notConfiguredStatus: TReadinessStatus = {
  label: "Not configured",
  variant: "warning",
  description: "Implementation support exists, but required instance configuration is missing.",
};

const disabledStatus: TReadinessStatus = {
  label: "Disabled",
  variant: "neutral",
  description: "Disabled by instance configuration or administrator preference.",
};

const unavailableStatus: TReadinessStatus = {
  label: "Unavailable",
  variant: "danger",
  description: "Implementation support is not available in this instance.",
};

const InstanceReadinessPage = observer(function InstanceReadinessPage(_props: Route.ComponentProps) {
  const { capabilities, isLoading, error } = useInstance();

  return (
    <PageWrapper
      header={{
        title: "Instance readiness",
        description:
          "Review self-hosted capability availability and configuration readiness. This page reports operational state only; backend permissions and project settings remain authoritative.",
      }}
    >
      <div className="space-y-6">
        <div className="flex gap-3 rounded-lg border border-subtle bg-layer-1 p-4 text-13 leading-5 text-secondary">
          <Info className="mt-0.5 size-4 shrink-0 text-tertiary" aria-hidden="true" />
          <p>
            Readiness is derived from the backend capability model introduced for self-hosted configuration. No secrets
            are fetched or displayed, and no provider network calls are made while rendering this page.
          </p>
        </div>
        {error ? (
          <div
            role="alert"
            className="rounded-lg border border-danger-subtle bg-danger-subtle p-4 text-13 text-danger-primary"
          >
            Capability readiness could not be loaded. This is different from services being unconfigured; try refreshing
            the Admin app or checking API availability.
          </div>
        ) : isLoading || !capabilities ? (
          <ReadinessLoader />
        ) : (
          capabilitySections(capabilities).map((section) => <CapabilitySection key={section.title} section={section} />)
        )}
      </div>
    </PageWrapper>
  );
});

export const meta: Route.MetaFunction = () => [{ title: "Instance Readiness - God Mode" }];

export default InstanceReadinessPage;
