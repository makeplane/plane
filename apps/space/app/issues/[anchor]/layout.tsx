/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { observer } from "mobx-react";
import { Outlet } from "react-router";
import type { ShouldRevalidateFunctionArgs } from "react-router";
import useSWR from "swr";
// components
import { LogoSpinner } from "@/components/common/logo-spinner";
import { PoweredBy } from "@/components/common/powered-by";
import { SomethingWentWrongError } from "@/components/issues/issue-layouts/error";
import { IssuesNavbarRoot } from "@/components/issues/navbar";
// hooks
import { PageNotFound } from "@/components/ui/not-found";
import { buildAnchorApiUrl } from "@/helpers/api.helper";
import { usePublish, usePublishList } from "@/hooks/store/publish";
import { useIssueFilter } from "@/hooks/store/use-issue-filter";
import type { Route } from "./+types/layout";

const DEFAULT_TITLE = "Plane";
const DEFAULT_DESCRIPTION = "Made with Plane, an AI-powered work management platform with publishing capabilities.";

interface IssueMetadata {
  name?: string;
  description?: string;
  cover_image?: string;
}

// Loader function runs on the server and fetches metadata
export async function loader({ params, request }: Route.LoaderArgs) {
  const { anchor } = params;

  const url = buildAnchorApiUrl(request.url, anchor, "/meta/");
  if (!url) return { metadata: null };

  try {
    const response = await fetch(url);

    if (!response.ok) {
      return { metadata: null };
    }

    const metadata: IssueMetadata = await response.json();
    return { metadata };
  } catch (error) {
    console.error("Error fetching issue metadata:", error);
    return { metadata: null };
  }
}

// Meta function uses the loader data to generate metadata
export function meta({ loaderData }: Route.MetaArgs) {
  const metadata = loaderData?.metadata;

  const title = metadata?.name || DEFAULT_TITLE;
  const description = metadata?.description || DEFAULT_DESCRIPTION;
  const coverImage = metadata?.cover_image;

  const metaTags = [
    { title },
    { name: "description", content: description },
    // OpenGraph metadata
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:type", content: "website" },
    // Twitter metadata
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
  ];

  // Add images if cover image exists
  if (coverImage) {
    metaTags.push(
      { property: "og:image", content: coverImage },
      { property: "og:image:width", content: "800" },
      { property: "og:image:height", content: "600" },
      { property: "og:image:alt", content: title },
      { name: "twitter:image", content: coverImage }
    );
  }

  return metaTags;
}

// Prevent loader from re-running on anchor param changes
export function shouldRevalidate({ currentParams, nextParams }: ShouldRevalidateFunctionArgs) {
  return currentParams.anchor !== nextParams.anchor;
}

function IssuesLayout(props: Route.ComponentProps) {
  const { anchor } = props.params;
  // store hooks
  const { fetchPublishSettings } = usePublishList();
  const publishSettings = usePublish(anchor);
  const { updateLayoutOptions } = useIssueFilter();
  // fetch publish settings
  const { error } = useSWR(
    anchor ? `PUBLISH_SETTINGS_${anchor}` : null,
    anchor
      ? async () => {
          const response = await fetchPublishSettings(anchor);
          if (response.view_props) {
            updateLayoutOptions({
              list: !!response.view_props.list,
              kanban: !!response.view_props.kanban,
              calendar: !!response.view_props.calendar,
              gantt: !!response.view_props.gantt,
              spreadsheet: !!response.view_props.spreadsheet,
            });
          }
        }
      : null
  );

  if (!publishSettings && !error) {
    return (
      <div className="bg-surface-1 flex items-center justify-center h-screen w-full">
        <LogoSpinner />
      </div>
    );
  }

  if (error?.status === 404) return <PageNotFound />;

  if (error) return <SomethingWentWrongError />;

  return (
    <>
      <div className="relative flex h-screen min-h-[500px] w-screen flex-col overflow-hidden">
        <div className="relative flex h-[60px] shrink-0 select-none items-center border-b border-subtle-1 bg-surface-1">
          <IssuesNavbarRoot publishSettings={publishSettings} />
        </div>
        <div className="relative size-full bg-surface-1 overflow-hidden">
          <Outlet />
        </div>
      </div>
      <PoweredBy />
    </>
  );
}

export default observer(IssuesLayout);
