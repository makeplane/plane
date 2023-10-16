import { FC } from "react";
import { useRouter } from "next/router";
import { mutate } from "swr";
import { PaperAirplaneIcon } from "@heroicons/react/24/outline";
import { Controller, useForm } from "react-hook-form";
// services
import { PageService } from "services/page.service";
// hooks
import useToast from "hooks/use-toast";
// ui
import { TextArea } from "@plane/ui";
// types
import { IUser, IPageBlock } from "types";
// fetch-keys
import { PAGE_BLOCKS_LIST } from "constants/fetch-keys";

const defaultValues = {
  name: "",
};

type Props = {
  user: IUser | undefined;
};

const pageService = new PageService();

export const CreateBlock: FC<Props> = ({ user }) => {
  // const [blockTitle, setBlockTitle] = useState("");
  // router
  const router = useRouter();
  const { workspaceSlug, projectId, pageId } = router.query;
  // toast
  const { setToastAlert } = useToast();
  // form info
  const {
    handleSubmit,
    control,
    watch,
    reset,
    formState: { errors },
  } = useForm<IPageBlock>({
    defaultValues,
  });

  const createPageBlock = async () => {
    if (!workspaceSlug || !projectId || !pageId) return;

    await pageService
      .createPageBlock(
        workspaceSlug as string,
        projectId as string,
        pageId as string,
        {
          name: watch("name"),
        },
        user
      )
      .then((res) => {
        mutate<IPageBlock[]>(
          PAGE_BLOCKS_LIST(pageId as string),
          (prevData) => [...(prevData as IPageBlock[]), res],
          false
        );
      })
      .catch(() => {
        setToastAlert({
          type: "error",
          title: "Error!",
          message: "Page could not be created. Please try again.",
        });
      });

    reset();
  };

  const handleKeyDown = (e: any) => {
    const keyCombination = ((e.ctrlKey || e.metaKey) && e.key === "Enter") || (e.shiftKey && e.key === "Enter");

    if (e.key === "Enter" && !keyCombination) {
      if (watch("name") && watch("name") !== "") {
        e.preventDefault();
        createPageBlock();
        reset();
      }
    }
  };

  return (
    <div className="relative">
      <form
        className="relative flex flex-col items-center justify-between h-32 rounded border-2 border-custom-border-200 p-2"
        onSubmit={handleSubmit(createPageBlock)}
      >
        <div className="flex min-h-full w-full">
          <Controller
            name="name"
            control={control}
            render={({ field: { value, onChange } }) => (
              <TextArea
                id="name"
                name="name"
                value={value}
                placeholder="Title"
                role="textbox"
                onKeyDown={handleKeyDown}
                maxLength={255}
                onChange={onChange}
                className="min-h-full block w-full resize-none overflow-hidden border-none bg-transparent !px-1 !py-1 text-sm font-medium"
                hasError={Boolean(errors?.name)}
              />
            )}
          />
        </div>

        <div className="absolute right-2 bottom-2 flex items-center p-1">
          <button type="submit">
            <PaperAirplaneIcon className="h-5 w-5 text-custom-text-100" />
          </button>
        </div>
      </form>
    </div>
  );
};
