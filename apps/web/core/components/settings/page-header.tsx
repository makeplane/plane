/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { Header } from "@plane/ui";

type Props = {
  leftItem?: React.ReactNode;
  rightItem?: React.ReactNode;
};

export function SettingsPageHeader(props: Props) {
  const { leftItem, rightItem } = props;

  return (
    <Header>
      {leftItem && <Header.LeftItem>{leftItem}</Header.LeftItem>}
      {rightItem && <Header.RightItem>{rightItem}</Header.RightItem>}
    </Header>
  );
}
