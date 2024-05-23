import React from "react";
import { observer } from "mobx-react";
import { IEstimate } from "@plane/types";

// components
import { EModalPosition, EModalWidth, ModalCore } from "@/components/core";

type Props = {
  isOpen: boolean;
  handleClose: () => void;
  data?: IEstimate;
};

export const DeleteEstimateModal: React.FC<Props> = observer((props) => {
  const { handleClose, isOpen, data } = props;

  console.log("data", data);

  return (
    <ModalCore isOpen={isOpen} handleClose={handleClose} position={EModalPosition.TOP} width={EModalWidth.XXL}>
      <div>Delete Estimate Modal</div>
    </ModalCore>
  );
});
