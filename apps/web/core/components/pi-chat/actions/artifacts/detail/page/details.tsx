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

import { useRef } from "react";
import { observer } from "mobx-react";
// plane imports
import type { EditorRefApi } from "@plane/editor";
import type { TPage } from "@plane/types";
// local imports
import type { TArtifact, TUpdatedArtifact } from "@/types";
import { usePageData } from "../../useArtifactData";
import { PiChatArtifactsFooter } from "../footer";
import { PageFormRoot } from "./root";

interface TPageDetailProps {
  data: TArtifact;
  artifactId: string;
  activeChatId: string;
  workspaceSlug: string;
  updateArtifact: (data: TUpdatedArtifact) => Promise<void>;
}

export const PageDetail = observer(function PageDetail(props: TPageDetailProps) {
  const { data, artifactId, activeChatId, workspaceSlug, updateArtifact } = props;
  const updatedData = usePageData(data.artifact_id);
  const editorRef = useRef<EditorRefApi>(null);
  // Helper: shallow/targeted equality for the page fields you care about.
  const isSameAsUpdatedData = (incoming: Partial<TPage> | null) => {
    if (!incoming) return true;
    // compare only known fields from your form
    const fields: (keyof Partial<TPage>)[] = ["description_html", "logo_props"];
    for (const f of fields) {
      const prev = JSON.stringify((updatedData as any)[f] ?? null);
      const next = JSON.stringify((incoming as any)[f] ?? null);
      if (prev !== next) return false;
    }
    return true;
  };

  const handleOnChange = async (formData: Partial<TPage> | null) => {
    if (!formData || isSameAsUpdatedData(formData)) return;
    try {
      await updateArtifact(formData as TUpdatedArtifact);
    } catch (err: any) {
      console.error(err);
    }
  };

  return (
    <>
      <PageFormRoot
        key={artifactId}
        workspaceSlug={workspaceSlug}
        artifactId={data.artifact_id}
        preloadedData={{
          description_html: updatedData.description_html,
          logo_props: updatedData.logo_props,
          name: updatedData.name,
        }}
        handleOnChange={handleOnChange}
        editorRef={editorRef}
      />
      <PiChatArtifactsFooter
        artifactsData={data}
        workspaceSlug={workspaceSlug}
        activeChatId={activeChatId}
        artifactId={data.artifact_id}
        onSubmit={(artifactData) => {
          editorRef?.current?.setEditorValue((artifactData as TPage).description_html ?? "<p></p>", true);
        }}
      />
    </>
  );
});
