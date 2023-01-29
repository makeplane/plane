import { FC, useEffect, useRef, useState } from "react";
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
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

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

  useEffect(() => {
    if (textareaRef && textareaRef.current) {
      textareaRef.current.style.height = "0px";
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = scrollHeight + "px";
    }
  }, [issueName]);

  return (
    <div>
      <textarea
        id="name"
        placeholder="Enter issue name"
        name="name"
        value={issueName}
        ref={textareaRef}
        rows={1}
        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setIssueName(e.target.value)}
        required={true}
        className="no-scrollbar w-full px-3 py-2 outline-none rounded border-none bg-transparent ring-0 transition-all focus:ring-1 focus:ring-theme text-xl font-medium resize-none"
      />

      <RemirrorRichTextEditor
        value={issueDescription}
        placeholder="Enter Your Text..."
        onJSONChange={(json) => setIssueDescription(json)}
        onHTMLChange={(html) => setIssueDescriptionHTML(html)}
        customClassName="min-h-[150px]"
      />
    </div>
  );
};
