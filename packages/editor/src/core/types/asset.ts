/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// constants
import type { CORE_EXTENSIONS } from "@/constants/extension";

export type TAdditionalEditorAsset = never;

export type TEditorImageAsset = {
  href: string;
  id: string;
  name: string;
  src: string;
  type: CORE_EXTENSIONS.IMAGE | CORE_EXTENSIONS.CUSTOM_IMAGE;
};

export type TEditorAsset = TEditorImageAsset | TAdditionalEditorAsset;
