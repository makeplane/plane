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
import { SomethingWentWrongError } from "@/components/issues/issue-layouts/error";
// hooks
import { PageNotFound } from "@/components/ui/not-found";
import { buildAnchorApiUrl } from "@/helpers/api.helper";
import { usePublish, usePublishList } from "@/hooks/store/publish";
// Plane web
import { ViewNavbarRoot } from "@/plane-web/components/navbar";
import { stripString } from "@/plane-web/helpers/string.helper";
import { useView } from "@/plane-web/hooks/store";
import type { Route } from "./+types/layout";

const DEFAULT_TITLE = "Plane";
const DEFAULT_DESCRIPTION = "Made with Plane, an AI-powered work management platform with publishing capabilities.";

interface ViewMetadata {
  name?: string;
  description?: string;
}

// Loader function runs on the server and fetches metadata
export async function loader({ params, request }: Route.LoaderArgs) {
  const { anchor } = params;

  const url = buildAnchorApiUrl(request.url, anchor, "/views/meta/");
  if (!url) return { metadata: null };

  try {
    const response = await fetch(url);

    if (!response.ok) {
      return { metadata: null };
    }

    const metadata: ViewMetadata = await response.json();
    return { metadata };
  } catch (error) {
    console.error("Error fetching view metadata:", error);
    return { metadata: null };
  }
}

// Meta function uses the loader data to generate metadata
export function meta({ loaderData }: Route.MetaArgs) {
  const metadata = loaderData?.metadata;

  const title = metadata?.name || DEFAULT_TITLE;
  const description = metadata?.description
    ? stripString(metadata.description, 150) || DEFAULT_DESCRIPTION
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

function ViewsLayout(props: Route.ComponentProps) {
  const { anchor } = props.params;
  // store hooks
  const { fetchPublishSettings } = usePublishList();
  const { viewData, fetchViewDetails } = useView();
  const publishSettings = usePublish(anchor);

  // fetch publish settings && view details
  const { error } = useSWR(
    anchor ? `PUBLISHED_VIEW_SETTINGS_${anchor}` : null,
    anchor
      ? async () => {
          const promises = [];
          promises.push(fetchPublishSettings(anchor));
          promises.push(fetchViewDetails(anchor));
          await Promise.all(promises);
        }
      : null
  );
  if (error?.status === 404) return <PageNotFound />;

  if (error) return <SomethingWentWrongError />;

  if (!publishSettings || !viewData)
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <LogoSpinner />
      </div>
    );

  return (
    <div className="relative flex h-screen min-h-[500px] w-screen flex-col overflow-hidden">
      <div className="relative flex h-[60px] flex-shrink-0 select-none items-center border-b border-subtle-1 bg-surface-1">
        <ViewNavbarRoot publishSettings={publishSettings} />
      </div>
      <div className="relative h-full w-full bg-surface-2 overflow-hidden">
        <Outlet />
      </div>
    </div>
  );
}

export default observer(ViewsLayout);
