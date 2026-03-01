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
import { Controller, useFormContext } from "react-hook-form";
// plane imports
import type { EditorRefApi } from "@plane/editor";
// components
import { LiteTextEditor } from "@/components/editor/lite-text/editor";
// local imports
import type { TAutomationActionFormData } from "../../root";

type TProps = {
  automationId: string;
  editorRef: React.RefObject<EditorRefApi>;
  isDisabled?: boolean;
  workspaceId: string;
  workspaceSlug: string;
};

export const AutomationActionAddCommentConfiguration = observer(function AutomationActionAddCommentConfiguration(
  props: TProps
) {
  const { automationId, editorRef, isDisabled, workspaceId, workspaceSlug } = props;
  // form hooks
  const { control } = useFormContext<TAutomationActionFormData>();

  return (
    <Controller
      control={control}
      name="config.comment_text"
      render={({ field: { onChange, value } }) => (
        <LiteTextEditor
          ref={editorRef}
          workspaceSlug={workspaceSlug}
          workspaceId={workspaceId}
          uploadFile={async () => ""} // TODO: Add upload file function
          duplicateFile={async () => ""} // TODO: Add duplicate file function
          id={automationId}
          initialValue={value || "<p></p>"}
          showSubmitButton={false}
          displayConfig={{
            fontSize: "small-font",
          }}
          disabledExtensions={["enter-key"]}
          onChange={(_json, html) => onChange(html)}
          parentClassName="p-2" // TODO: add background if disabled
          editable={!isDisabled}
          variant={isDisabled ? "none" : "full"}
        />
      )}
    />
  );
});
