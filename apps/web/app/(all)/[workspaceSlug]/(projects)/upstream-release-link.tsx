/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { CircleArrowUp } from "lucide-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Tooltip } from "@plane/propel/tooltip";
// hooks
import { useInstance } from "@/hooks/store/use-instance";

const UPSTREAM_RELEASE_TAG_URL = "https://github.com/makeplane/plane/releases/tag";

/**
 * Parses a version string such as "1.2.0" or "v1.4.2" into its numeric segments.
 * A leading "v" is ignored, as is anything after the dotted number (for example
 * "-rc1"). A value that does not start with a number returns null so that it can
 * be treated as unknown rather than compared incorrectly.
 */
const parseVersionSegments = (value: string): number[] | null => {
  const match = value.trim().replace(/^v/i, "").match(/^\d+(?:\.\d+)*/);
  if (!match) return null;
  return match[0].split(".").map(Number);
};

/**
 * Returns true only when `latest` is strictly newer than `current`. Missing
 * segments count as zero, so "1.3" is newer than "1.2.9" but equal to "1.3.0".
 * Anything unparseable returns false, so an unexpected version string leaves the
 * indicator hidden instead of claiming an update that may not exist.
 */
const isNewerVersion = (current: string | undefined, latest: string | undefined): boolean => {
  if (!current || !latest) return false;

  const currentSegments = parseVersionSegments(current);
  const latestSegments = parseVersionSegments(latest);
  if (!currentSegments || !latestSegments) return false;

  const segmentCount = Math.max(currentSegments.length, latestSegments.length);
  for (let index = 0; index < segmentCount; index++) {
    const currentSegment = currentSegments[index] ?? 0;
    const latestSegment = latestSegments[index] ?? 0;
    if (latestSegment > currentSegment) return true;
    if (latestSegment < currentSegment) return false;
  }

  return false;
};

/**
 * Shows a link to the newest upstream Plane release when this deployment is
 * behind it, and renders nothing when it is up to date.
 *
 * Both versions come from the instance record, which the API refreshes at
 * start-up by reading the latest release of makeplane/plane from GitHub. Nothing
 * is fetched from the browser, but it does mean the comparison is only as fresh
 * as the last API restart.
 */
export const UpstreamReleaseLink = observer(function UpstreamReleaseLink() {
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const { instance } = useInstance();
  // derived values
  const currentVersion = instance?.current_version;
  const latestVersion = instance?.latest_version;

  if (!isNewerVersion(currentVersion, latestVersion)) return null;

  return (
    <Tooltip
      tooltipContent={t("home.update_available_tooltip", {
        current: currentVersion,
        latest: latestVersion,
      })}
      position="bottom"
    >
      <a
        aria-label={t("home.update_available")}
        className="flex flex-shrink-0 items-center gap-1.5 rounded-sm bg-layer-2 px-3 py-1.5"
        href={`${UPSTREAM_RELEASE_TAG_URL}/${latestVersion}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        <CircleArrowUp className="size-4 shrink-0 text-accent-primary" aria-hidden="true" />
        <span className="hidden text-11 font-medium sm:hidden md:block">
          {t("home.update_available")} · {latestVersion}
        </span>
      </a>
    </Tooltip>
  );
});
