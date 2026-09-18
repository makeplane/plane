/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { EModalWidth, ModalCore } from "@plane/ui";
import { Stickies } from "./stickies";

type TProps = {
  isOpen: boolean;
  handleClose: () => void;
};
export function AllStickiesModal(props: TProps) {
  const { isOpen, handleClose } = props;
  return (
    <ModalCore isOpen={isOpen} handleClose={handleClose} width={EModalWidth.VXL}>
      <Stickies handleClose={handleClose} />
    </ModalCore>
  );
}
