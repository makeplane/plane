import { useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import { FavouriteFolderIcon, Input, setToast, TOAST_TYPE } from "@plane/ui";
import { useFavourite } from "@/hooks/store/use-favourite";
import useOutsideClickDetector from "@/hooks/use-outside-click-detector";

type TForm = {
  name: string;
  entity_type: string;
  parent: string | null;
  project_id: string | null;
  is_folder: boolean;
};
type TProps = {
  setCreateNewFolder: (value: boolean | string) => void;
  actionType: "create" | "rename";
  defaultName?: string;
  favouriteId?: string;
};
export const NewFavouriteFolder = (props: TProps) => {
  const { setCreateNewFolder, actionType, defaultName, favouriteId } = props;
  const { workspaceSlug } = useParams();
  const { addFavourite, updateFavourite } = useFavourite();

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
    addFavourite(workspaceSlug.toString(), formData)
      .then(() => {
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: "Success!",
          message: "Favourite created successfully.",
        });
      })
      .catch((err) => {
        Object.keys(err.data).map((key) => {
          setToast({
            type: TOAST_TYPE.ERROR,
            title: "Error!",
            message: err.data[key],
          });
        });
      });
    setCreateNewFolder(false);
    setValue("name", "");
  };

  const handleRenameFolder: SubmitHandler<TForm> = (formData) => {
    if (!favouriteId) return;
    const payload = {
      name: formData.name,
    };
    updateFavourite(workspaceSlug.toString(), favouriteId, payload).then(() => {
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Success!",
        message: "Favourite updated successfully.",
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
      <FavouriteFolderIcon />
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
