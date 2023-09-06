import { TipTapEditor } from "components/tiptap";
import type { NextPage } from "next";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { PrimaryButton, Spinner } from "components/ui";
import { useRouter } from "next/router";
import Cookies from "js-cookie";
const Editor: NextPage = () => {
  const [isLoading, setIsLoading] = useState("false");
  const router = useRouter();
  const { workspaceSlug, editable } = router.query;
  const {
    watch,
    setValue,
    control,
    formState: { errors },
  } = useForm({
    defaultValues: {
      data: "",
      data_html: "",
    },
  });

  useEffect(() => {
    setIsLoading("true");
    if (!router.query["editable"]) return;
    setIsLoading("false");
    const data_html = Cookies.get("data_html");
    setValue("data_html", data_html ?? "");
  }, [router.query, setValue]);

  return isLoading === "true" ? (
    <div className="grid place-items-center h-screen w-full">
      <Spinner />
    </div>
  ) : (
    <div className="flex-col blur-none shadow-none backdrop:backdrop-blur-none  justify-center items-center">
      <Controller
        name="data_html"
        control={control}
        render={({ field: { value, onChange } }) => (
          <TipTapEditor
            borderOnFocus={false}
            value={
              !value ||
              value === "" ||
              (typeof value === "object" && Object.keys(value).length === 0)
                ? watch("data_html")
                : value
            }
            editable={editable === "true"}
            noBorder={true}
            workspaceSlug={workspaceSlug?.toString() ?? ""}
            debouncedUpdatesEnabled={true}
            customClassName="min-h-[150px] shadow-sm"
            editorContentCustomClassNames="pb-9"
            onChange={(description: Object, description_html: string) => {
              onChange(description_html);
              setValue("data_html", description_html);
              setValue("data", JSON.stringify(description));
            }}
          />
        )}
      />
      {editable === "true" ? (
        <PrimaryButton
          className="mt-4 w-[calc(100%-30px)] h-[45px] mx-[15px] text-[17px]"
          onClick={() => {
            console.log(
              "submitted",
              JSON.stringify({
                data_html: watch("data_html"),
              })
            );
          }}
        >
          Submit
        </PrimaryButton>
      ) : (
        <></>
      )}
    </div>
  );
};

export default Editor;
