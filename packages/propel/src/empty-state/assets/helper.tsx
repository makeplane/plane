/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

export const ILLUSTRATION_COLOR_TOKEN_MAP = {
  fill: {
    primary: "var(--illustration-fill-primary)", // #FFFFFF
    secondary: "var(--illustration-fill-secondary)", // #F4F5F5
    tertiary: "var(--illustration-fill-tertiary)", // #eaebeb
    quaternary: "var(--illustration-fill-quaternary)", // #CFD2D3
  },
  stroke: {
    primary: "var(--illustration-stroke-primary)", //#CFD2D3
    secondary: "var(--illustration-stroke-secondary)", // #8A9093
    tertiary: "var(--illustration-stroke-tertiary)", // #1d1f20
  },
};

export type TIllustrationAssetProps = {
  className?: string;
};
