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

import type { ISvgIcons } from "./type";

export function MembersFilledIcon({ className = "text-current", color = "currentColor", ...rest }: ISvgIcons) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...rest}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12.0211 9.91751C12.1128 9.56094 12.4763 9.34629 12.8329 9.43806C14.2704 9.80806 15.3334 11.1122 15.3334 12.6663V13.9997C15.3334 14.3679 15.0349 14.6663 14.6667 14.6663C14.2985 14.6663 14 14.3679 14 13.9997V12.6663C14 11.7353 13.3633 10.9514 12.5005 10.7293C12.1439 10.6375 11.9293 10.2741 12.0211 9.91751Z"
        fill={color}
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M9.7154 1.94337C9.85355 1.60208 10.2422 1.4374 10.5835 1.57555C11.8039 2.06955 12.6667 3.26638 12.6667 4.66634C12.6667 6.0663 11.8039 7.26313 10.5835 7.75713C10.2422 7.89528 9.85355 7.7306 9.7154 7.38931C9.57725 7.04802 9.74193 6.65936 10.0832 6.52121C10.8174 6.22402 11.3334 5.50464 11.3334 4.66634C11.3334 3.82805 10.8174 3.10866 10.0832 2.81147C9.74193 2.67332 9.57725 2.28466 9.7154 1.94337Z"
        fill={color}
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M4.78598 9.33298C5.81757 9.33332 6.84915 9.33332 7.88073 9.33298C8.60781 9.33275 9.10395 9.33258 9.52942 9.44659C10.6797 9.75481 11.5782 10.6533 11.8864 11.8036C12.0399 12.3765 11.9955 12.9887 12.0001 13.5757C12.0007 13.647 12.0019 13.7912 11.966 13.9252C11.8735 14.2703 11.6039 14.5398 11.2588 14.6323C11.1248 14.6682 10.9807 14.667 10.9094 14.6665C7.85941 14.6421 4.80731 14.6421 1.7573 14.6665C1.68602 14.667 1.54188 14.6682 1.40787 14.6323C1.06278 14.5398 0.793233 14.2703 0.700765 13.9252C0.664858 13.7912 0.666007 13.647 0.666575 13.5757C0.671243 12.9902 0.627014 12.3756 0.780272 11.8036C1.0885 10.6533 1.98699 9.75481 3.13729 9.44659C3.56277 9.33258 4.05891 9.33275 4.78598 9.33298Z"
        fill={color}
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M3.00002 4.66634C3.00002 2.82539 4.49241 1.33301 6.33336 1.33301C8.17431 1.33301 9.66669 2.82539 9.66669 4.66634C9.66669 6.50729 8.17431 7.99967 6.33336 7.99967C4.49241 7.99967 3.00002 6.50729 3.00002 4.66634Z"
        fill={color}
      />
    </svg>
  );
}
