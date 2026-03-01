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

type TProps = {
  text: string;
};

export function ConjunctionLabel(props: TProps) {
  const { text } = props;

  return <p className="leading-4 text-13 text-accent-primary font-medium font-mono uppercase">{text}</p>;
}
