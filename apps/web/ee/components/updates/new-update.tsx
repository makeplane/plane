import { useState } from "react";
import { useTranslation } from "@plane/i18n";
import { EUpdateStatus, TUpdate } from "@plane/types";
import { Button, TextArea } from "@plane/ui";
import { StatusDropdown } from "./status-dropdown";

type TProps = {
  initialValues?: TUpdate;
  handleClose: () => void;
  handleCreate: (data: Partial<TUpdate>) => void;
};
export const NewUpdate = (props: TProps) => {
  const { handleClose, handleCreate, initialValues } = props;
  const { t } = useTranslation();
  const [input, setInput] = useState(initialValues?.description ?? "");
  const [selectedStatus, setSelectedStatus] = useState(initialValues?.status ?? EUpdateStatus.ON_TRACK);
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <div className="border border-custom-border-100 rounded-md p-4 flex flex-col gap-4">
      {/* Type */}
      <StatusDropdown selectedStatus={selectedStatus} setStatus={setSelectedStatus} />

      {/* Textarea */}
      <TextArea
        className="border-none p-0 text-sm min-h-4"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder={t("updates.add_update_placeholder")}
        autoFocus
      />

      {/* actions */}
      <div className="flex m-auto mr-0 text-sm gap-2 w-fit">
        <Button onClick={handleClose} variant="neutral-primary" size="sm">
          {t("cancel")}
        </Button>
        <Button
          onClick={async () => {
            setIsSubmitting(true);
            await handleCreate({
              status: selectedStatus,
              description: input,
            });
            setIsSubmitting(false);
          }}
          size="sm"
          disabled={input === "" || isSubmitting}
        >
          {t("updates.add_update")}
        </Button>
      </div>
    </div>
  );
};
