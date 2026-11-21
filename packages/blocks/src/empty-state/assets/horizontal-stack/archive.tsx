/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { ILLUSTRATION_COLOR_TOKEN_MAP } from "../helper";

export type ArchiveHorizontalStackIllustrationProps = {
  className?: string;
};

/** Card stack with an archive box on the front card. */
export function ArchiveHorizontalStackIllustration({ className }: ArchiveHorizontalStackIllustrationProps) {
  return (
    <svg
      width="72"
      height="81"
      viewBox="0 0 72 81"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <g opacity="0.2">
        <path
          d="M42.4559 2.91759C41.655 2.51021 40.6262 2.54473 39.5076 3.11092L8.67113 18.8261C6.1371 20.1172 4.0795 23.6663 4.0795 26.7458V64.2729C4.0795 65.9922 4.71473 67.2005 5.71591 67.7184L2.63642 66.151C1.63523 65.6401 1 64.4248 1 62.7055V25.1784C1 22.092 3.0576 18.5499 5.59163 17.2587L36.4281 1.54355C37.5536 0.970462 38.5824 0.942844 39.3764 1.35022L42.4559 2.91759Z"
          fill={ILLUSTRATION_COLOR_TOKEN_MAP.fill.secondary}
          stroke={ILLUSTRATION_COLOR_TOKEN_MAP.stroke.secondary}
          strokeWidth="0.35"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M42.4558 2.91754C43.457 3.42849 44.0922 4.64374 44.0922 6.36301V43.8901C44.0922 46.9766 42.0346 50.5187 39.5005 51.8099L8.66409 67.525C7.53862 68.0981 6.5098 68.1257 5.71576 67.7183C4.71458 67.2074 4.07935 65.9922 4.07935 64.2729V26.7457C4.07935 23.6593 6.13695 20.1172 8.67098 18.826L39.5075 3.11088C40.6329 2.53778 41.6617 2.51017 42.4558 2.91754Z"
          fill={ILLUSTRATION_COLOR_TOKEN_MAP.fill.primary}
          stroke={ILLUSTRATION_COLOR_TOKEN_MAP.stroke.secondary}
          strokeWidth="0.35"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      <g opacity="0.6">
        <path
          d="M55.9132 8.904C55.1123 8.49662 54.0835 8.53114 52.9649 9.09733L22.1284 24.8125C19.5944 26.1036 17.5368 29.6527 17.5368 32.7322V70.2593C17.5368 71.9786 18.172 73.1869 19.1732 73.7048L16.0937 72.1374C15.0925 71.6265 14.4573 70.4112 14.4573 68.692V31.1648C14.4573 28.0784 16.5149 24.5363 19.0489 23.2451L49.8854 7.52994C51.0109 6.95685 52.0397 6.92923 52.8337 7.33661L55.9132 8.904Z"
          fill={ILLUSTRATION_COLOR_TOKEN_MAP.fill.secondary}
          stroke={ILLUSTRATION_COLOR_TOKEN_MAP.stroke.secondary}
          strokeWidth="0.35"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M55.913 8.90393C56.9142 9.41488 57.5495 10.6301 57.5495 12.3494V49.8765C57.5495 52.9629 55.4918 56.5051 52.9578 57.7962L22.1213 73.5114C20.9959 74.0845 19.9671 74.1121 19.173 73.7047C18.1719 73.1938 17.5366 71.9785 17.5366 70.2593V32.7321C17.5366 29.6457 19.5942 26.1036 22.1283 24.8124L52.9647 9.09726C54.0902 8.52417 55.119 8.49655 55.913 8.90393Z"
          fill={ILLUSTRATION_COLOR_TOKEN_MAP.fill.primary}
          stroke={ILLUSTRATION_COLOR_TOKEN_MAP.stroke.secondary}
          strokeWidth="0.35"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      <path
        d="M69.3636 14.8489C68.5627 14.4415 67.5339 14.476 66.4153 15.0422L35.5788 30.7573C33.0448 32.0485 30.9872 35.5975 30.9872 38.6771V76.2042C30.9872 77.9235 31.6225 79.1318 32.6236 79.6497L29.5441 78.0823C28.5429 77.5713 27.9077 76.3561 27.9077 74.6368V37.1097C27.9077 34.0233 29.9653 30.4812 32.4994 29.19L63.3358 13.4748C64.4613 12.9017 65.4901 12.8741 66.2842 13.2815L69.3636 14.8489Z"
        fill={ILLUSTRATION_COLOR_TOKEN_MAP.fill.secondary}
        stroke={ILLUSTRATION_COLOR_TOKEN_MAP.stroke.secondary}
        strokeWidth="0.35"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M69.3635 14.8489C70.3646 15.3598 70.9999 16.5751 70.9999 18.2943V55.8215C70.9999 58.9079 68.9423 62.45 66.4083 63.7412L35.5718 79.4563C34.4463 80.0294 33.4175 80.0571 32.6235 79.6497C31.6223 79.1387 30.9871 77.9235 30.9871 76.2042V38.6771C30.9871 35.5907 33.0446 32.0485 35.5787 30.7574L66.4152 15.0422C67.5406 14.4691 68.5694 14.4415 69.3635 14.8489Z"
        fill={ILLUSTRATION_COLOR_TOKEN_MAP.fill.primary}
        stroke={ILLUSTRATION_COLOR_TOKEN_MAP.stroke.secondary}
        strokeWidth="0.35"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <g transform="matrix(1 -0.51 0 1 31 33.1)">
        <rect x="9" y="14" width="22" height="5.5" rx="1.5" fill={ILLUSTRATION_COLOR_TOKEN_MAP.stroke.secondary} />
        <path
          d="M10.8 20.5H29.2V33.5C29.2 34.6 28.3 35.5 27.2 35.5H12.8C11.7 35.5 10.8 34.6 10.8 33.5V20.5Z"
          fill={ILLUSTRATION_COLOR_TOKEN_MAP.fill.primary}
          stroke={ILLUSTRATION_COLOR_TOKEN_MAP.stroke.secondary}
          strokeWidth="1.2"
          strokeLinejoin="round"
        />
        <rect x="16" y="24" width="8" height="2.6" rx="1.3" fill={ILLUSTRATION_COLOR_TOKEN_MAP.stroke.secondary} />
      </g>
    </svg>
  );
}
