/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

export enum ERowVariant {
  REGULAR = "regular",
  HUGGING = "hugging",
}
export type TRowVariant = ERowVariant.REGULAR | ERowVariant.HUGGING;
export interface IRowProperties {
  [key: string]: string;
}
export const rowStyle: IRowProperties = {
  [ERowVariant.REGULAR]: "px-page-x",
  [ERowVariant.HUGGING]: "px-0",
};
