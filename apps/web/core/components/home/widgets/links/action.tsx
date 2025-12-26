import { useTranslation } from "@plane/i18n";
import { PlusIcon } from "@plane/propel/icons";

type TProps = {
  onClick: () => void;
};
export function AddLink(props: TProps) {
  const { onClick } = props;
  const { t } = useTranslation();

  return (
    <button
      className="btn btn-primary flex bg-surface-1 px-4 w-[230px] h-[56px] border-[0.5px] border-subtle rounded-md gap-4"
      onClick={onClick}
    >
      <div className="rounded-sm p-2 bg-layer-1/40 w-8 h-8 my-auto">
        <PlusIcon className="h-4 w-4 stroke-2 text-tertiary" />
      </div>
      <div className="text-13 font-medium my-auto">{t("home.quick_links.add")}</div>
    </button>
  );
}
