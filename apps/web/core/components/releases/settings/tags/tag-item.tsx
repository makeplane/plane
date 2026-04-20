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

import type { Dispatch, SetStateAction } from "react";
import { useState } from "react";
import { observer } from "mobx-react";
import type { ReleaseTag } from "@plane/types";
// local
import type { ReleaseTagOperationsCallbacks } from "./inline-form";
import { CreateUpdateReleaseTagInline } from "./inline-form";
import { ReleaseTagBlock } from "./tag-block";
import { TagIcon } from "@plane/propel/icons";

type Props = {
  tag: ReleaseTag;
  setIsUpdating: Dispatch<SetStateAction<boolean>>;
  handleTagDelete: (tag: ReleaseTag) => void;
  tagOperationsCallbacks: ReleaseTagOperationsCallbacks;
  permissions: {
    canEdit: boolean;
    canDelete: boolean;
  };
};

export const ReleaseTagItem = observer(function ReleaseTagItem(props: Props) {
  const { tag, setIsUpdating, handleTagDelete, tagOperationsCallbacks, permissions } = props;
  const [isEditForm, setEditForm] = useState(false);

  return (
    <div className="rounded-sm border-[1.5px] border-transparent">
      <div className="rounded-sm border-[0.5px] border-subtle-1 bg-surface-1">
        <div className="py-2 pl-3 flex items-center gap-2">
          <TagIcon width={15} height={15} />
          {isEditForm && permissions.canEdit ? (
            <CreateUpdateReleaseTagInline
              isUpdating
              tagToUpdate={tag}
              tagOperationsCallbacks={tagOperationsCallbacks}
              onClose={() => {
                setEditForm(false);
                setIsUpdating(false);
              }}
            />
          ) : (
            <ReleaseTagBlock
              tag={tag}
              handleEdit={() => {
                setEditForm(true);
                setIsUpdating(true);
              }}
              handleDelete={handleTagDelete}
              permissions={permissions}
            />
          )}
        </div>
      </div>
    </div>
  );
});
