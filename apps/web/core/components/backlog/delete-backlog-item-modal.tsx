import { useState } from "react";
import { Button } from "@plane/propel/button";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@plane/ui";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  item: { title: string; id: string };
  familyId: string;
  onConfirm: () => Promise<void>;
};

export function DeleteBacklogItemModal(props: Props) {
  const { isOpen, onClose, item, onConfirm } = props;
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onConfirm();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalContent>
        <ModalHeader>
          <h2 className="text-lg font-semibold">Delete Backlog Item</h2>
        </ModalHeader>
        <ModalBody>
          <p className="text-sm text-custom-text-300">
            Are you sure you want to delete "{item.title}"? This action cannot be undone.
          </p>
        </ModalBody>
        <ModalFooter>
          <Button variant="outline" onClick={onClose} disabled={isDeleting}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDelete} loading={isDeleting}>
            Delete
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

