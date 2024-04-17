import { FC } from "react";
import { observer } from "mobx-react";
import { TIssue } from "@plane/types";
import { Input } from "@plane/ui";

type TInboxIssueTitle = {
  data: Partial<TIssue>;
  handleData: (issueKey: keyof Partial<TIssue>, issueValue: Partial<TIssue>[keyof Partial<TIssue>]) => void;
};

export const InboxIssueTitle: FC<TInboxIssueTitle> = observer((props) => {
  const { data, handleData } = props;

  return (
    <div className="relative flex flex-wrap gap-2 items-center">
      <Input
        id="name"
        name="name"
        type="text"
        value={data?.name}
        onChange={(e) => handleData("name", e.target.value)}
        placeholder="Title"
        className="w-full resize-none text-xl"
        maxLength={255}
        required
      />
    </div>
  );
});
