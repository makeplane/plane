import { useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import { FavoriteFolderIcon, Input, setToast, TOAST_TYPE } from "@plane/ui";
import { useFavorite } from "@/hooks/store/use-favorite";
import useOutsideClickDetector from "@/hooks/use-outside-click-detector";

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
export const NewFavoriteFolder = (props: TProps) => {
  const { setCreateNewFolder, actionType, defaultName, favoriteId } = props;
  const { workspaceSlug } = useParams();
  const { addFavorite, updateFavorite } = useFavorite();

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
    formData = {
      entity_type: "folder",
      is_folder: true,
      name: formData.name,
      parent: null,
      project_id: null,
    };
    addFavorite(workspaceSlug.toString(), formData)
      .then(() => {
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: "Success!",
          message: "Favorite created successfully.",
        });
      })
      .catch(() => {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: "Something went wrong!",
        });
      });
    setCreateNewFolder(false);
    setValue("name", "");
  };

  const handleRenameFolder: SubmitHandler<TForm> = (formData) => {
    if (!favoriteId) return;
    const payload = {
      name: formData.name,
    };
    updateFavorite(workspaceSlug.toString(), favoriteId, payload).then(() => {
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Success!",
        message: "Favorite updated successfully.",
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
      <FavoriteFolderIcon />
      <form onSubmit={handleSubmit(actionType === "create" ? handleAddNewFolder : handleRenameFolder)}>
        <Controller
          name="name"
          control={control}
          render={({ field }) => <Input placeholder="New folder" {...field} />}
        />
      </form>
    </div>
  );
};
