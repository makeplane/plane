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

// components
import type { TPowerKCommandConfig, TPowerKContext, TPowerKPageType } from "@/components/power-k/core/types";
// local imports
import { WikiAppPowerKContextBasedPagesList } from "./pages/context-based/root";
import { WikiAppPowerKModalPagesList } from "./pages/root";
import { WikiAppPowerKModalSearchMenu } from "./search-menu";

export type TPowerKCommandsListProps = {
  activePage: TPowerKPageType | null;
  context: TPowerKContext;
  handleCommandSelect: (command: TPowerKCommandConfig) => void;
  handlePageDataSelection: (data: unknown) => void;
  isWorkspaceLevel: boolean;
  searchTerm: string;
  setSearchTerm: (value: string) => void;
};

export function WikiAppPowerKCommandsList(props: TPowerKCommandsListProps) {
  const {
    activePage,
    context,
    handleCommandSelect,
    handlePageDataSelection,
    isWorkspaceLevel,
    searchTerm,
    setSearchTerm,
  } = props;

  return (
    <>
      <WikiAppPowerKModalSearchMenu
        activePage={activePage}
        context={context}
        isWorkspaceLevel={!context.params.projectId || isWorkspaceLevel}
        searchTerm={searchTerm}
        updateSearchTerm={setSearchTerm}
      />
      <WikiAppPowerKContextBasedPagesList
        activeContext={context.activeContext}
        activePage={activePage}
        handleSelection={handlePageDataSelection}
      />
      <WikiAppPowerKModalPagesList
        activePage={activePage}
        context={context}
        onPageDataSelect={handlePageDataSelection}
        onCommandSelect={handleCommandSelect}
      />
    </>
  );
}
