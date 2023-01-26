import { FC, useEffect, useState } from "react";
import dynamic from "next/dynamic";
// types
import { IIssue } from "types";
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
// hooks
import useDebounce from "hooks/use-debounce";

export interface IssueDescriptionFormValues {
  name: string;
  description: any;
  description_html: string;
}

export interface IssueDetailsProps {
  issue: IIssue;
  handleSubmit: (value: IssueDescriptionFormValues) => void;
}

export const IssueDescriptionForm: FC<IssueDetailsProps> = ({ issue, handleSubmit }) => {
  // states
  // const [issueFormValues, setIssueFormValues] = useState({
  //   name: issue.name,
  //   description: issue?.description,
  //   description_html: issue?.description_html,
  // });

  const [issueName, setIssueName] = useState(issue?.name);
  const [issueDescription, setIssueDescription] = useState(issue?.description);
  const [issueDescriptionHTML, setIssueDescriptionHTML] = useState(issue?.description_html);

  // hooks
  const formValues = useDebounce(
    { name: issueName, description: issueDescription, description_html: issueDescriptionHTML },
    2000
  );
  const stringFromValues = JSON.stringify(formValues);

  useEffect(() => {
    handleSubmit(formValues);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handleSubmit, stringFromValues]);

  return (
    <div>
      <Input
        id="name"
        placeholder="Enter issue name"
        name="name"
        autoComplete="off"
        value={issueName}
        onChange={(e) => setIssueName(e.target.value)}
        mode="transparent"
        className="text-xl font-medium"
        required={true}
      />
      <RemirrorRichTextEditor
        value={issueDescription}
        placeholder="Enter Your Text..."
        onJSONChange={(json) => setIssueDescription(json)}
        onHTMLChange={(html) => setIssueDescriptionHTML(html)}
      />
    </div>
  );
};
