import { CircleChevronRight, Trash2 } from "lucide-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Tooltip } from "@plane/ui";

type Props = {
  handleClose: () => void;
  handleDelete: () => void;
};

export const WidgetConfigSidebarHeader: React.FC<Props> = (props) => {
  const { handleClose, handleDelete } = props;
  // translation
  const { t } = useTranslation();

  return (
    <div className="flex-shrink-0 flex items-center justify-between gap-2">
      <div className="flex-shrink-0">
        <button
          type="button"
          className="size-4 grid place-items-center text-custom-text-200 hover:text-custom-text-100 transition-colors"
          onClick={handleClose}
        >
          <CircleChevronRight className="size-3.5" />
        </button>
      </div>
      <div className="flex-shrink-0">
        <Tooltip tooltipContent={t("common.delete")}>
          <button
            type="button"
            onClick={handleDelete}
            className="size-4 grid place-items-center text-custom-text-200 hover:text-red-500 transition-colors"
          >
            <Trash2 className="size-3.5" />
          </button>
        </Tooltip>
      </div>
    </div>
  );
};
