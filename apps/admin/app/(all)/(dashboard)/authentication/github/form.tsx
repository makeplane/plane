/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { isEmpty } from "lodash-es";
// plane internal packages
import { API_BASE_URL } from "@plane/constants";
import type { IFormattedInstanceConfiguration, TInstanceGithubAuthenticationConfigurationKeys } from "@plane/types";
// components
import { CodeBlock } from "@/components/common/code-block";
import type { TControllerInputFormField } from "@/components/common/controller-input";
import type { TControllerSwitchFormField } from "@/components/common/controller-switch";
import type { TCopyField } from "@/components/common/copy-field";
import { OAuthProviderForm } from "@/components/authentication/oauth-provider-form";
// hooks
import { useOAuthProviderConfigForm } from "@/hooks/use-oauth-provider-config-form";

type Props = {
  config: IFormattedInstanceConfiguration;
};

type GithubConfigFormValues = Record<TInstanceGithubAuthenticationConfigurationKeys, string>;

const GITHUB_FORM_SWITCH_FIELD: TControllerSwitchFormField<GithubConfigFormValues> = {
  name: "ENABLE_GITHUB_SYNC",
  label: "GitHub",
};

export function InstanceGithubConfigForm(props: Props) {
  const { config } = props;
  // form data
  const {
    control,
    formState: { errors },
    onSave,
  } = useOAuthProviderConfigForm<GithubConfigFormValues>("GitHub", {
    GITHUB_CLIENT_ID: config["GITHUB_CLIENT_ID"],
    GITHUB_CLIENT_SECRET: config["GITHUB_CLIENT_SECRET"],
    GITHUB_ORGANIZATION_ID: config["GITHUB_ORGANIZATION_ID"],
    ENABLE_GITHUB_SYNC: config["ENABLE_GITHUB_SYNC"] || "0",
  });

  const originURL = !isEmpty(API_BASE_URL) ? API_BASE_URL : typeof window !== "undefined" ? window.location.origin : "";

  const GITHUB_FORM_FIELDS: TControllerInputFormField<GithubConfigFormValues>[] = [
    {
      key: "GITHUB_CLIENT_ID",
      type: "text",
      label: "Client ID",
      description: (
        <>
          You will get this from your{" "}
          <a
            href="https://github.com/settings/applications/new"
            target="_blank"
            className="text-accent-primary hover:underline"
            rel="noreferrer"
          >
            GitHub OAuth application settings.
          </a>
        </>
      ),
      placeholder: "70a44354520df8bd9bcd",
      error: Boolean(errors.GITHUB_CLIENT_ID),
      required: true,
    },
    {
      key: "GITHUB_CLIENT_SECRET",
      type: "password",
      label: "Client secret",
      description: (
        <>
          Your client secret is also found in your{" "}
          <a
            href="https://github.com/settings/applications/new"
            target="_blank"
            className="text-accent-primary hover:underline"
            rel="noreferrer"
          >
            GitHub OAuth application settings.
          </a>
        </>
      ),
      placeholder: "9b0050f94ec1b744e32ce79ea4ffacd40d4119cb",
      error: Boolean(errors.GITHUB_CLIENT_SECRET),
      required: true,
    },
    {
      key: "GITHUB_ORGANIZATION_ID",
      type: "text",
      label: "Organization ID",
      description: <>The organization github ID.</>,
      placeholder: "123456789",
      error: Boolean(errors.GITHUB_ORGANIZATION_ID),
      required: false,
    },
  ];

  const GITHUB_COMMON_SERVICE_DETAILS: TCopyField[] = [
    {
      key: "Origin_URL",
      label: "Origin URL",
      url: originURL,
      description: (
        <>
          We will auto-generate this. Paste this into the <CodeBlock darkerShade>Authorized origin URL</CodeBlock> field{" "}
          <a
            href="https://github.com/settings/applications/new"
            target="_blank"
            className="text-accent-primary hover:underline"
            rel="noreferrer"
            aria-label="GitHub OAuth application settings"
          >
            here.
          </a>
        </>
      ),
    },
  ];

  const GITHUB_SERVICE_DETAILS: TCopyField[] = [
    {
      key: "Callback_URI",
      label: "Callback URI",
      url: `${originURL}/auth/github/callback/`,
      description: (
        <>
          We will auto-generate this. Paste this into your <CodeBlock darkerShade>Authorized Callback URI</CodeBlock>{" "}
          field{" "}
          <a
            href="https://github.com/settings/applications/new"
            target="_blank"
            className="text-accent-primary hover:underline"
            rel="noreferrer"
            aria-label="GitHub OAuth application settings"
          >
            here.
          </a>
        </>
      ),
    },
  ];

  return (
    <OAuthProviderForm
      providerName="GitHub"
      control={control}
      formFields={GITHUB_FORM_FIELDS}
      switchField={GITHUB_FORM_SWITCH_FIELD}
      onSave={onSave}
      serviceDetails={GITHUB_COMMON_SERVICE_DETAILS}
      webServiceDetails={GITHUB_SERVICE_DETAILS}
    />
  );
}
