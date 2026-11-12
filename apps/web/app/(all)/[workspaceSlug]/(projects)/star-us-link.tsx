/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// plane imports
import { Button } from "@makeplane/propel/components/button";
import { Icon } from "@makeplane/propel/components/icon";
import { IconButton } from "@makeplane/propel/components/icon-button";
import { Github } from "@makeplane/propel/icons";
import { useTranslation } from "@plane/i18n";

const GITHUB_REPO_URL = "https://github.com/makeplane/plane";

export function StarUsOnGitHubLink() {
  // plane hooks
  const { t } = useTranslation();
  const label = t("home.star_us_on_github");

  return (
    <>
      {/* labelled tertiary button from md up; icon-only below, as the label used to hide there */}
      <span className="hidden shrink-0 md:flex">
        <Button
          variant="tertiary"
          size="md"
          stretch="auto"
          nativeButton={false}
          render={<a href={GITHUB_REPO_URL} target="_blank" rel="noopener noreferrer" aria-label={label} />}
          icon={<Icon icon={Github} />}
          label={label}
        />
      </span>
      <span className="flex shrink-0 md:hidden">
        <IconButton
          variant="tertiary"
          size="md"
          nativeButton={false}
          render={<a href={GITHUB_REPO_URL} target="_blank" rel="noopener noreferrer" aria-label={label} />}
          icon={<Icon icon={Github} />}
          aria-label={label}
          showTooltip={false}
        />
      </span>
    </>
  );
}
