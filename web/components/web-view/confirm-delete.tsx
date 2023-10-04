import { WebViewModal } from "components/web-view";

type DeleteConfirmationProps = {
  isOpen: boolean;
  title: string;
  content: string | React.ReactNode;
  onCancel: () => void;
  onConfirm: () => void;
};

export const DeleteConfirmation: React.FC<DeleteConfirmationProps> = (props) => {
  const { isOpen, onCancel, onConfirm, title, content } = props;

  return (
    <WebViewModal isOpen={isOpen} onClose={onCancel} modalTitle={title}>
      <div className="text-custom-text-200">
        <p>{content}</p>
      </div>
      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={onConfirm}
          className="w-full py-2 flex items-center justify-center rounded-[4px] bg-red-500/10 text-red-500 border border-red-500 text-base font-medium"
        >
          Delete
        </button>
      </div>
    </WebViewModal>
  );
};
