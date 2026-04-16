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
// hooks
import { PageNotFound } from "@/components/ui/not-found";
import { buildAnchorApiUrl } from "@/helpers/api.helper";
import { usePublish, usePublishList } from "@/hooks/store/publish";
// plane web components
import { PageDetailsError } from "@/plane-web/components/pages";
import { stripString } from "@/plane-web/helpers/string.helper";
import type { Route } from "./+types/layout";

const DEFAULT_TITLE = "Plane";
const DEFAULT_DESCRIPTION = "Made with Plane, an AI-powered work management platform with publishing capabilities.";

interface PageMetadata {
  name?: string;
  description_stripped?: string;
}

// Loader function runs on the server and fetches metadata
export async function loader({ params, request }: Route.LoaderArgs) {
  const { anchor } = params;

  const url = buildAnchorApiUrl(request.url, anchor, "/pages/meta/");
  if (!url) return { metadata: null };

  try {
    const response = await fetch(url);

    if (!response.ok) {
      return { metadata: null };
    }

    const metadata: PageMetadata = await response.json();
    return { metadata };
  } catch (error) {
    console.error("Error fetching page metadata:", error);
    return { metadata: null };
  }
}

// Meta function uses the loader data to generate metadata
export function meta({ loaderData }: Route.MetaArgs) {
  const metadata = loaderData?.metadata;

  const title = metadata?.name || DEFAULT_TITLE;
  const description = metadata?.description_stripped
    ? stripString(metadata.description_stripped, 150) || DEFAULT_DESCRIPTION
    : DEFAULT_DESCRIPTION;

  return [
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
}

// Prevent loader from re-running on anchor param changes
export function shouldRevalidate({ currentParams, nextParams }: ShouldRevalidateFunctionArgs) {
  return currentParams.anchor !== nextParams.anchor;
}

function PagesLayout(props: Route.ComponentProps) {
  const { anchor } = props.params;
  // store hooks
  const { fetchPublishSettings } = usePublishList();
  const { entity_identifier } = usePublish(anchor);
  // fetch publish settings
  const { error } = useSWR(
    anchor ? `PUBLISH_SETTINGS_${anchor}` : null,
    anchor ? () => fetchPublishSettings(anchor) : null
  );

  if (!entity_identifier && !error)
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <LogoSpinner />
      </div>
    );

  if (error?.status === 404) return <PageNotFound />;

  if (error) return <PageDetailsError />;

  return (
    <div className="size-full flex flex-col h-screen min-h-screen bg-surface-1">
      <Outlet />
    </div>
  );
}

export default observer(PagesLayout);
