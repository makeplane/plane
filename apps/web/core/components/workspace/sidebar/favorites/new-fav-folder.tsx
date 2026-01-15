import { useEffect, useRef } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import type { SubmitHandler } from "react-hook-form";
import { Controller, useForm } from "react-hook-form";
import { useOutsideClickDetector } from "@plane/hooks";
import { useTranslation } from "@plane/i18n";
// plane helpers
// plane ui
import { FavoriteFolderIcon } from "@plane/propel/icons";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { Input } from "@plane/ui";
// hooks
import { useFavorite } from "@/hooks/store/use-favorite";

type TForm = {
  name: string;
  entity_type: string;
  parent: string | null;
  project_id: string | null;
  is_folder: boolean;
};
type TProps = {
  setCreateNewFolder: (value: boolean | string | null) => void;
  actionType: "create" | "rename";
  defaultName?: string;
  favoriteId?: string;
};
export const NewFavoriteFolder = observer(function NewFavoriteFolder(props: TProps) {
  const { setCreateNewFolder, actionType, defaultName, favoriteId } = props;
  const { t } = useTranslation();
  const { workspaceSlug } = useParams();
  const { addFavorite, updateFavorite, existingFolders } = useFavorite();

  // ref
  const ref = useRef(null);

  // form info
  const { handleSubmit, control, setValue, setFocus } = useForm<TForm>({
    reValidateMode: "onChange",
    defaultValues: {
      name: defaultName,
    },
  });

  const handleAddNewFolder: SubmitHandler<TForm> = (formData) => {
    if (existingFolders.includes(formData.name))
      return setToast({
        type: TOAST_TYPE.ERROR,
        title: t("error"),
        message: t("folder_already_exists"),
      });
    formData = {
      entity_type: "folder",
      is_folder: true,
      name: formData.name.trim(),
      parent: null,
      project_id: null,
    };

    if (formData.name === "")
      return setToast({
        type: TOAST_TYPE.ERROR,
        title: t("error"),
        message: t("folder_name_cannot_be_empty"),
      });

    addFavorite(workspaceSlug.toString(), formData)
      .then(() => {
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: t("success"),
          message: t("favorite_created_successfully"),
        });
        return;
      })
      .catch(() => {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: t("error"),
          message: t("something_went_wrong"),
        });
      });
    setCreateNewFolder(false);
    setValue("name", "");
  };

  const handleRenameFolder: SubmitHandler<TForm> = (formData) => {
    if (!favoriteId) return;
    if (existingFolders.includes(formData.name))
      return setToast({
        type: TOAST_TYPE.ERROR,
        title: t("error"),
        message: t("folder_already_exists"),
      });
    const payload = {
      name: formData.name.trim(),
    };

    if (formData.name.trim() === "")
      return setToast({
        type: TOAST_TYPE.ERROR,
        title: t("error"),
        message: t("folder_name_cannot_be_empty"),
      });

    updateFavorite(workspaceSlug.toString(), favoriteId, payload)
      .then(() => {
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: t("success"),
          message: t("favorite_updated_successfully"),
        });
        return;
      })
      .catch(() => {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: t("error"),
          message: t("something_went_wrong"),
        });
      });
    setCreateNewFolder(false);
    setValue("name", "");
  };

  useEffect(() => {
    setFocus("name");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useOutsideClickDetector(ref, () => {
    setCreateNewFolder(false);
  });
  return (
    <div className="flex items-center gap-1.5 py-[1px] px-2" ref={ref}>
      <FavoriteFolderIcon className="size-4" />
      <form onSubmit={handleSubmit(actionType === "create" ? handleAddNewFolder : handleRenameFolder)}>
        <Controller
          name="name"
          control={control}
          rules={{ required: true }}
          render={({ field }) => (
            <Input
              className="w-full"
              placeholder={t("new_folder")}
              aria-label={t("aria_labels.projects_sidebar.enter_folder_name")}
              {...field}
            />
          )}
        />
      </form>
    </div>
  );
});
