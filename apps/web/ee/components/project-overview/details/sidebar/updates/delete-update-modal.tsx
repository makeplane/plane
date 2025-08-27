import { FC, useState } from "react";
import { observer } from "mobx-react";
// ui
import { AlertModalCore } from "@plane/ui";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  updateId: string;
  updateOperations: {
    remove: (updateId: string) => Promise<void>;
  };
};

export const ProjectUpdateDeleteModal: FC<Props> = observer((props) => {
  const { isOpen, onClose, updateId, updateOperations } = props;
  // states
  const [loader, setLoader] = useState(false);

  // handlers
  const handleClose = () => {
    onClose();
    setLoader(false);
  };

  const handleDeletion = async (updateId: string) => {
    setLoader(true);
    updateOperations.remove(updateId).finally(() => handleClose());
  };

  if (!updateId) return <></>;
  return (
    <AlertModalCore
      handleClose={handleClose}
      handleSubmit={() => handleDeletion(updateId)}
      isSubmitting={loader}
      isOpen={isOpen}
      title="Delete update"
      content={<>Are you sure you want to delete this update? This is an irreversible action.</>}
    />
  );
});
