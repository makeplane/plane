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

import { NodeViewContent } from "@tiptap/react";

type CustomAIBlockPreviewProps = {
  hasContent: boolean;
};
const CustomAIBlockPreview = (props: CustomAIBlockPreviewProps) => {
  const { hasContent } = props;

  return (
    <>
      {hasContent ? (
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <NodeViewContent
            placeholder="Describe the content of this block"
            as="div"
            className="w-full break-words prose prose-sm max-w-none"
          />
        </div>
      ) : (
        <div className="text-body-md-regular text-primary w-full text-start flex-1" contentEditable={false}>
          Your AI content will be generated here
        </div>
      )}
    </>
  );
};

export default CustomAIBlockPreview;
