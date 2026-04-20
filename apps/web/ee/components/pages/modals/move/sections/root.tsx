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

import { useMemo } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane imports
import { Book } from "lucide-react";
import { Logo } from "@plane/propel/emoji-icon-picker";
import { WikiIcon } from "@plane/propel/icons";
import type { TLogoProps } from "@plane/types";
// plane web imports
import { useCollection, useWorkspaceFeatures } from "@/plane-web/hooks/store";
import { EWorkspaceFeatures } from "@/types/workspace-feature";
// local imports
import { MovePageModalListItem } from "../list-item";
import { MovePageModalListSection } from "../list-section";
import type { TMovePageSelectedValue } from "../root";
import { MovePageModalProjectsListSection } from "./projects-list";
import { MovePageModalTeamspacesListSection } from "./teamspaces-list";
import { DEFAULT_WIKI_COLLECTION, DefaultWikiCollectionIcon } from "../../../collections";

type Props = {
  canPageBeMovedToTeamspace: boolean;
  canPageBeMovedToWiki: boolean;
  searchTerm: string;
  workspaceSlug: string;
};

export const MovePageModalSections = observer(function MovePageModalSections(props: Props) {
  const { canPageBeMovedToTeamspace, canPageBeMovedToWiki, searchTerm, workspaceSlug } = props;
  // navigation
  const { teamspaceId, projectId } = useParams();
  // store hooks
  const collectionStore = useCollection();
  const { isWorkspaceFeatureEnabled } = useWorkspaceFeatures();
  const isTeamspacesEnabled = isWorkspaceFeatureEnabled(workspaceSlug, EWorkspaceFeatures.IS_TEAMSPACES_ENABLED);
  const canPageBeMovedToWikiCollections = canPageBeMovedToWiki && canPageBeMovedToTeamspace;
  const customCollections = useMemo(
    () =>
      canPageBeMovedToWikiCollections
        ? (collectionStore.workspaceCollections ?? []).filter((collection) => !collection.is_default)
        : [],
    [canPageBeMovedToWikiCollections, collectionStore.workspaceCollections]
  );
  const filteredCustomCollectionIds = useMemo(
    () =>
      customCollections
        .filter((collection) => collection.name.toLowerCase().includes(searchTerm.toLowerCase()))
        .map((collection) => collection.id),
    [customCollections, searchTerm]
  );
  const normalizedSearchTerm = searchTerm.trim().toLowerCase();
  const shouldShowGeneralCollection =
    normalizedSearchTerm.length === 0 ||
    [DEFAULT_WIKI_COLLECTION.slug, DEFAULT_WIKI_COLLECTION.displayName].some((value) =>
      value.toLowerCase().includes(normalizedSearchTerm)
    );
  // section components
  const projectsListSection = <MovePageModalProjectsListSection searchTerm={searchTerm} />;
  const teamspacesListSection =
    isTeamspacesEnabled && canPageBeMovedToTeamspace ? (
      <MovePageModalTeamspacesListSection searchTerm={searchTerm} />
    ) : null;
  const wikiListItems = useMemo(() => {
    const items = shouldShowGeneralCollection ? ["workspace"] : [];
    return [...items, ...filteredCustomCollectionIds];
  }, [filteredCustomCollectionIds, shouldShowGeneralCollection]);

  return (
    <div className="space-y-3">
      {canPageBeMovedToWiki && !canPageBeMovedToTeamspace && (
        <section className="px-2">
          <MovePageModalListItem
            item={{
              logo: <WikiIcon className="size-4" />,
              name: "Wiki",
              value: "workspace" satisfies TMovePageSelectedValue,
            }}
          />
        </section>
      )}
      {canPageBeMovedToWiki && canPageBeMovedToTeamspace && wikiListItems.length > 0 && (
        <MovePageModalListSection
          title="WIKI"
          items={wikiListItems}
          getItemDetails={(itemValue) => {
            if (itemValue === "workspace") {
              return {
                logo: <DefaultWikiCollectionIcon className="size-4 text-label-grey-icon" />,
                name: DEFAULT_WIKI_COLLECTION.displayName,
                value: "workspace" satisfies TMovePageSelectedValue,
              };
            }

            const collection = customCollections.find((currentCollection) => currentCollection.id === itemValue);
            if (!collection) return null;
            const collectionLogoProps = collection.logo_props as TLogoProps | undefined;

            return {
              logo: collectionLogoProps?.in_use ? (
                <Logo logo={collectionLogoProps} size={12} type="lucide" />
              ) : (
                <Book className="size-3.5 text-tertiary" />
              ),
              name: collection.name,
              value: `workspace-${collection.id}` satisfies TMovePageSelectedValue,
            };
          }}
        />
      )}
      {projectId ? (
        <>
          {projectsListSection}
          {teamspacesListSection}
        </>
      ) : teamspaceId ? (
        <>
          {teamspacesListSection}
          {projectsListSection}
        </>
      ) : (
        <>
          {projectsListSection}
          {teamspacesListSection}
        </>
      )}
    </div>
  );
});
