import { FC, useCallback, useEffect, useMemo } from "react";

import dynamic from "next/dynamic";

// react-hook-form
import { useForm } from "react-hook-form";
// lodash
import debounce from "lodash.debounce";
// components
import { Loader, Input } from "components/ui";
const RemirrorRichTextEditor = dynamic(() => import("components/rich-text-editor"), {
  ssr: false,
  loading: () => (
    <Loader>
      <Loader.Item height="12rem" width="100%" />
    </Loader>
  ),
});
// types
import { IIssue } from "types";

export interface IssueDescriptionFormValues {
  name: string;
  description: any;
  description_html: string;
}

export interface IssueDetailsProps {
  issue: IIssue;
  handleFormSubmit: (value: IssueDescriptionFormValues) => void;
}

export const IssueDescriptionForm: FC<IssueDetailsProps> = ({ issue, handleFormSubmit }) => {
  const { handleSubmit, watch, setValue, reset } = useForm<IIssue>({
    defaultValues: {
      name: "",
      description: "",
      description_html: "",
    },
  });

  const handleDescriptionFormSubmit = useCallback(
    (formData: Partial<IIssue>) => {
      handleFormSubmit({
        name: formData.name ?? "",
        description: formData.description,
        description_html: formData.description_html,
      });
    },
    [handleFormSubmit]
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

  return (
    <div>
      <Input
        id="name"
        placeholder="Enter issue name"
        name="name"
        value={watch("name")}
        autoComplete="off"
        onChange={(e) => {
          setValue("name", e.target.value);
          debounceHandler();
        }}
        mode="transparent"
        className="text-xl font-medium"
        required={true}
      />

      <RemirrorRichTextEditor
        value={watch("description")}
        placeholder="Describe the issue..."
        onJSONChange={(json) => {
          setValue("description", json);
          debounceHandler();
        }}
        onHTMLChange={(html) => setValue("description_html", html)}
      />
    </div>
  );
};
