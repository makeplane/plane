/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { isEmpty } from "lodash-es";
// plane internal packages
import { API_BASE_URL } from "@plane/constants";
import type { IFormattedInstanceConfiguration, TInstanceGitlabAuthenticationConfigurationKeys } from "@plane/types";
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

type GitlabConfigFormValues = Record<TInstanceGitlabAuthenticationConfigurationKeys, string>;

const GITLAB_FORM_SWITCH_FIELD: TControllerSwitchFormField<GitlabConfigFormValues> = {
  name: "ENABLE_GITLAB_SYNC",
  label: "GitLab",
};

export function InstanceGitlabConfigForm(props: Props) {
  const { config } = props;
  // form data
  const {
    control,
    formState: { errors },
    onSave,
  } = useOAuthProviderConfigForm<GitlabConfigFormValues>("GitLab", {
    GITLAB_HOST: config["GITLAB_HOST"],
    GITLAB_CLIENT_ID: config["GITLAB_CLIENT_ID"],
    GITLAB_CLIENT_SECRET: config["GITLAB_CLIENT_SECRET"],
    ENABLE_GITLAB_SYNC: config["ENABLE_GITLAB_SYNC"] || "0",
  });

  const originURL = !isEmpty(API_BASE_URL) ? API_BASE_URL : typeof window !== "undefined" ? window.location.origin : "";

  const GITLAB_FORM_FIELDS: TControllerInputFormField<GitlabConfigFormValues>[] = [
    {
      key: "GITLAB_HOST",
      type: "text",
      label: "Host",
      description: (
        <>
          This is either https://gitlab.com or the <CodeBlock>domain.tld</CodeBlock> where you host GitLab.
        </>
      ),
      placeholder: "https://gitlab.com",
      error: Boolean(errors.GITLAB_HOST),
      required: true,
    },
    {
      key: "GITLAB_CLIENT_ID",
      type: "text",
      label: "Application ID",
      description: (
        <>
          Get this from your{" "}
          <a
            href="https://docs.gitlab.com/ee/integration/oauth_provider.html"
            target="_blank"
            className="text-accent-primary hover:underline"
            rel="noreferrer"
          >
            GitLab OAuth application settings
          </a>
          .
        </>
      ),
      placeholder: "c2ef2e7fc4e9d15aa7630f5637d59e8e4a27ff01dceebdb26b0d267b9adcf3c3",
      error: Boolean(errors.GITLAB_CLIENT_ID),
      required: true,
    },
    {
      key: "GITLAB_CLIENT_SECRET",
      type: "password",
      label: "Secret",
      description: (
        <>
          The client secret is also found in your{" "}
          <a
            href="https://docs.gitlab.com/ee/integration/oauth_provider.html"
            target="_blank"
            className="text-accent-primary hover:underline"
            rel="noreferrer"
          >
            GitLab OAuth application settings
          </a>
          .
        </>
      ),
      placeholder: "gloas-f79cfa9a03c97f6ffab303177a5a6778a53c61e3914ba093412f68a9298a1b28",
      error: Boolean(errors.GITLAB_CLIENT_SECRET),
      required: true,
    },
  ];

  const GITLAB_SERVICE_FIELD: TCopyField[] = [
    {
      key: "Callback_URL",
      label: "Callback URL",
      url: `${originURL}/auth/gitlab/callback/`,
      description: (
        <>
          We will auto-generate this. Paste this into the <CodeBlock darkerShade>Redirect URI</CodeBlock> field of your{" "}
          <a
            href="https://docs.gitlab.com/ee/integration/oauth_provider.html"
            target="_blank"
            className="text-accent-primary hover:underline"
            rel="noreferrer"
          >
            GitLab OAuth application
          </a>
          .
        </>
      ),
    },
  ];

  return (
    <OAuthProviderForm
      providerName="GitLab"
      control={control}
      formFields={GITLAB_FORM_FIELDS}
      switchField={GITLAB_FORM_SWITCH_FIELD}
      onSave={onSave}
      serviceDetails={GITLAB_SERVICE_FIELD}
    />
  );
}
