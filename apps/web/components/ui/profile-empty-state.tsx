/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React from "react";

type Props = {
  title: string;
  description?: React.ReactNode;
  image: any;
};

export function ProfileEmptyState({ title, description, image }: Props) {
  return (
    <div className={`mx-auto grid h-full w-full place-items-center p-8`}>
      <div className="flex w-full flex-col items-center text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-surface-2">
          <img src={image} width="32" height="32" className="h-full w-full object-cover" alt={title} />
        </div>
        <h6 className="mt-3.5 mb-3 text-14 font-semibold">{title}</h6>
        {description && <p className="text-13 text-tertiary">{description}</p>}
      </div>
    </div>
  );
}
