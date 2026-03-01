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
import type { TPageVersion } from "@plane/types";
import { findPreviousVersion, decodeVersionBinary } from "../helpers/binary-version-helpers";

type UseBinaryVersionDisplayProps = {
  versionsList: TPageVersion[] | undefined;
  activeVersionDetails: TPageVersion | undefined;
};

type DecodedContent = {
  contentBinaryEncoded: string;
  contentJSON: object;
  contentHTML: string;
  titleHTML?: string;
};

type UseBinaryVersionDisplayReturn = {
  canRenderBinaryDiff: boolean;
  previousVersion: TPageVersion | undefined;
  decodedContent: DecodedContent | null;
  previousDecodedContent: DecodedContent | null;
};

/**
 * Custom hook to manage binary version display with diff visualization
 * Follows React best practices: no internal state, derived values only, single responsibility
 */
export const useBinaryVersionDisplay = ({
  versionsList,
  activeVersionDetails,
}: UseBinaryVersionDisplayProps): UseBinaryVersionDisplayReturn => {
  const previousVersion = useMemo(() => {
    if (!versionsList || !activeVersionDetails?.id) {
      return undefined;
    }
    return findPreviousVersion(versionsList, activeVersionDetails.id);
  }, [versionsList, activeVersionDetails?.id]);

  const canRenderBinaryDiff = useMemo(
    () => !!activeVersionDetails?.description_binary,
    [activeVersionDetails?.description_binary]
  );

  const decodedContent = useMemo(() => {
    if (!activeVersionDetails?.description_binary) {
      return null;
    }
    return decodeVersionBinary(activeVersionDetails.description_binary);
  }, [activeVersionDetails?.description_binary]);

  const previousDecodedContent = useMemo(() => {
    if (!previousVersion?.description_binary) {
      return null;
    }
    return decodeVersionBinary(previousVersion.description_binary);
  }, [previousVersion?.description_binary]);

  return {
    canRenderBinaryDiff,
    previousVersion,
    decodedContent,
    previousDecodedContent,
  };
};
