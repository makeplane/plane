import { useState } from "react";

// components
import { CreateUpdateProjectViewModal } from "components/views";
// ui
import { PrimaryButton } from "components/ui";
// icons
import { PlusIcon } from "lucide-react";

export const ProjectViewsHeader = () => {
  const [createViewModal, setCreateViewModal] = useState(false);

  return (
    <>
      <CreateUpdateProjectViewModal isOpen={createViewModal} onClose={() => setCreateViewModal(false)} />
      <div>
        <PrimaryButton
          type="button"
          className="flex items-center gap-2"
          onClick={() => {
            const e = new KeyboardEvent("keydown", { key: "v" });
            document.dispatchEvent(e);
          }}
        >
          <PlusIcon size={14} strokeWidth={2} />
          Create View
        </PrimaryButton>
      </div>
    </>
  );
};
