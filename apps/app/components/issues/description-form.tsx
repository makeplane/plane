import { FC, useCallback, useEffect, useMemo } from "react";

import dynamic from "next/dynamic";

// react-hook-form
import { useForm } from "react-hook-form";
// lodash
import debounce from "lodash.debounce";
// components
import { Loader, TextArea } from "components/ui";
const RemirrorRichTextEditor = dynamic(() => import("components/rich-text-editor"), {
  ssr: false,
  loading: () => (
    <Loader>
      <Loader.Item height="12rem" width="100%" />
    </Loader>
  ),
});
// types
import { IIssue, UserAuth } from "types";
import useToast from "hooks/use-toast";

export interface IssueDescriptionFormValues {
  name: string;
  description: any;
  description_html: string;
}

export interface IssueDetailsProps {
  issue: IIssue;
  handleFormSubmit: (value: IssueDescriptionFormValues) => void;
  userAuth: UserAuth;
}

export const IssueDescriptionForm: FC<IssueDetailsProps> = ({
  issue,
  handleFormSubmit,
  userAuth,
}) => {
  const { setToastAlert } = useToast();

  const {
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<IIssue>({
    defaultValues: {
      name: "",
      description: "",
      description_html: "",
    },
  });

  const handleDescriptionFormSubmit = useCallback(
    (formData: Partial<IIssue>) => {
      if (!formData.name || formData.name === "") {
        setToastAlert({
          type: "error",
          title: "Error in saving!",
          message: "Title is required.",
        });
        return;
      }

      if (formData.name.length > 255) {
        setToastAlert({
          type: "error",
          title: "Error in saving!",
          message: "Title cannot have more than 255 characters.",
        });
        return;
      }

      handleFormSubmit({
        name: formData.name ?? "",
        description: formData.description ?? "",
        description_html: formData.description_html ?? "<p></p>",
      });
    },
    [handleFormSubmit, setToastAlert]
  );

  const debounceHandler = useMemo(
    () => debounce(handleSubmit(handleDescriptionFormSubmit), 2000),
    [handleSubmit, handleDescriptionFormSubmit]
  );

  useEffect(
    () => () => {
      debounceHandler.cancel();
    },
    [debounceHandler]
  );

  // reset form values
  useEffect(() => {
    if (!issue) return;

    reset(issue);
  }, [issue, reset]);

  const isNotAllowed = userAuth.isGuest || userAuth.isViewer;

  return (
    <div>
      <TextArea
        id="name"
        placeholder="Enter issue name"
        name="name"
        value={watch("name")}
        onChange={(e) => {
          setValue("name", e.target.value);
          debounceHandler();
        }}
        required={true}
        className="block px-3 py-2 text-xl
      w-full overflow-hidden resize-none min-h-10
      rounded border-none bg-transparent ring-0 focus:ring-1 focus:ring-theme outline-none "
        role="textbox "
      />
      <span>{errors.name ? errors.name.message : null}</span>
      <RemirrorRichTextEditor
        value={watch("description")}
        placeholder="Describe the issue..."
        onJSONChange={(json) => {
          setValue("description", json);
          debounceHandler();
        }}
        onHTMLChange={(html) => setValue("description_html", html)}
        editable={!isNotAllowed}
      />
    </div>
  );
};
