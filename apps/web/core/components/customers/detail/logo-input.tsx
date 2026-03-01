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

import React, { useEffect, useState } from "react";
import { observer } from "mobx-react";
// plane imports
import { CustomersIcon, EditIcon } from "@plane/propel/icons";
import { Input } from "@plane/ui";

type TProps = {
  handleOpenLogoInput: () => void;
  onLogoUpload: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  logoInputRef: React.RefObject<HTMLInputElement>;
  customerLogoSrc?: string;
  logo: File | null;
};

export const CustomerLogoInput = observer(function CustomerLogoInput(props: TProps) {
  const { handleOpenLogoInput, onLogoUpload, customerLogoSrc, logo, logoInputRef } = props;

  // Memoize the blob URL and revoke on cleanup to prevent memory leaks
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  useEffect(() => {
    if (logo) {
      const url = URL.createObjectURL(logo);
      setBlobUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    setBlobUrl(null);
  }, [logo]);

  // Resolve the logo source with priority: local file > uploaded asset / crawler favicon
  const resolvedSrc = blobUrl ?? customerLogoSrc;

  return (
    <div className="rounded-md border-subtle-1 p-1 relative group cursor-pointer" onClick={() => handleOpenLogoInput()}>
      <Input className="hidden" type="file" onChange={onLogoUpload} maxLength={1} ref={logoInputRef} />
      <div className="absolute -right-1 -top-1 p-1.5 rounded-full bg-surface-1 border border-subtle-1 hidden group-hover:inline">
        <EditIcon className="size-2.5" />
      </div>
      {resolvedSrc ? (
        <div className="bg-surface-1 rounded-md h-11 w-11 overflow-hidden border-[0.5px] border-subtle-1">
          <img src={resolvedSrc} alt="customer logo" className="w-full h-full object-cover rounded-md" />
        </div>
      ) : (
        <div className="bg-layer-1 rounded-md flex items-center justify-center h-11 w-11 p-1.5">
          <CustomersIcon className="size-5 opacity-50" />
        </div>
      )}
    </div>
  );
});
